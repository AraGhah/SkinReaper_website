/**
 * Skinreaper booking backend — Google Apps Script Web app.
 *
 *   GET  ?                      -> {"ok":true,"service":"skinreaper-booking"}
 *   GET  ?action=busy&from&to   -> {"ok":true,"busy":[{"start":ms,"end":ms}, ...]}
 *   POST (JSON as text/plain)   -> re-checks the slot, creates the event, invites the client,
 *                                  emails the client and the artist (with reference photos)
 *
 * Deploy: Deploy > New deployment > Web app, Execute as "Me", Who has access "Anyone".
 */

var CONFIG = {
  CALENDAR_ID: 'primary',      // or a specific calendar id
  TZ: 'America/Toronto',
  OPEN_DAYS: [2, 3, 4, 5, 6],  // ISO weekdays, 1 Monday ... 7 Sunday
  OPEN_HOUR: 11,
  CLOSE_HOUR: 19,
  LOCATION: 'Velours Tattoo, 3455 Saint-Laurent Blvd, Montréal, QC H2X 2T6',
  MAX_BOOKINGS_PER_EMAIL: 3,   // per 6 hours, stops spam
  ARTIST_EMAIL: '',            // empty = the Google account that owns this script
  ARTIST_NAME: 'Skinreaper',
  INSTAGRAM: 'https://instagram.com/_skinreaper',
  MAX_DAYS_AHEAD: 200
};

var DAY_MS = 24 * 3600 * 1000;

/* ------------------------------------------------------------------ */

function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.action === 'busy') return json_(busy_(p.from, p.to));
    return json_({ ok: true, service: 'skinreaper-booking' });
  } catch (err) {
    return json_({ ok: false, error: 'server_error', message: String(err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    // Honeypot filled in: pretend it worked, do nothing.
    if (data.company) return json_({ ok: true, status: 'booked' });

    var invalid = validate_(data);
    if (invalid) return json_({ ok: false, error: invalid });

    var email = String(data.email).trim().toLowerCase();
    if (!rateOk_(email)) return json_({ ok: false, error: 'rate_limited' });

    var slot = slotTimes_(data.date, data.slot);
    if (!slot) return json_({ ok: false, error: 'bad_slot' });
    if (slot.start.getTime() <= Date.now()) return json_({ ok: false, error: 'slot_taken' });
    if (slot.start.getTime() > Date.now() + CONFIG.MAX_DAYS_AHEAD * DAY_MS) return json_({ ok: false, error: 'too_far' });

    lock.waitLock(20000);
    locked = true;

    var cal = calendar_();
    var clash = cal.getEvents(slot.start, slot.end).some(blocks_);
    if (clash) return json_({ ok: false, error: 'slot_taken' });

    var event = cal.createEvent(eventTitle_(data), slot.start, slot.end, {
      description: detailsText_(data, slot),
      location: CONFIG.LOCATION,
      guests: email,
      sendInvites: true
    });

    lock.releaseLock();
    locked = false;

    bumpRate_(email);
    sendClient_(data, slot);
    sendArtist_(data, slot, event);

    return json_({ ok: true, status: 'booked', eventId: event.getId() });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'server_error', message: String(err) });
  } finally {
    if (locked) {
      try { lock.releaseLock(); } catch (ignore) {}
    }
  }
}

/* ------------------------------------------------------------------ */

function busy_(from, to) {
  var start = from ? new Date(from) : new Date();
  var end = to ? new Date(to) : new Date(start.getTime() + 62 * DAY_MS);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return { ok: false, error: 'bad_range' };
  if (end.getTime() - start.getTime() > 100 * DAY_MS) end = new Date(start.getTime() + 100 * DAY_MS);

  var busy = calendar_().getEvents(start, end).filter(blocks_).map(function (ev) {
    return { start: ev.getStartTime().getTime(), end: ev.getEndTime().getTime() };
  });
  return { ok: true, busy: busy };
}

/** An event blocks a slot unless it is marked Free (transparent) or declined. */
function blocks_(ev) {
  try {
    if (ev.getTransparency && ev.getTransparency() === CalendarApp.EventTransparency.TRANSPARENT) return false;
  } catch (ignore) {}
  try {
    if (ev.getMyStatus && ev.getMyStatus() === CalendarApp.GuestStatus.NO) return false;
  } catch (ignore) {}
  return true;
}

function calendar_() {
  var cal = CONFIG.CALENDAR_ID === 'primary'
    ? CalendarApp.getDefaultCalendar()
    : CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
  if (!cal) throw new Error('Calendar not found: ' + CONFIG.CALENDAR_ID);
  return cal;
}

/* ------------------------------------------------------------------ */

function validate_(d) {
  if (!d || typeof d !== 'object') return 'bad_request';
  if (!str_(d.name, 1, 120)) return 'bad_name';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(d.email || '').trim())) return 'bad_email';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(d.date || ''))) return 'bad_date';
  if (!str_(d.slot, 2, 80)) return 'bad_slot';
  if (!str_(d.idea, 10, 5000)) return 'bad_idea';
  if (d.pregnant === true) return 'pregnancy_policy';
  if (d.acknowledged !== true) return 'acknowledgements';
  if (d.photos && (!Array.isArray(d.photos) || d.photos.length > 4)) return 'too_many_photos';
  return '';
}

function str_(v, min, max) {
  var s = String(v == null ? '' : v).trim();
  return s.length >= min && s.length <= max;
}

/**
 * Slot labels start with the hour ("11:00", "11 h").
 * "full day" / "journée complète" = 8 h, "half day" / "demi" = 4 h, anything else = 2 h.
 */
function parseSlot_(label) {
  var m = /^\s*(\d{1,2})\s*(?::|h)\s*(\d{2})?/i.exec(label);
  if (!m) return null;
  var l = String(label).toLowerCase();
  var hours = /full day|journée complète|journee complete/.test(l) ? 8 : (/half day|demi/.test(l) ? 4 : 2);
  return { h: Number(m[1]), min: Number(m[2] || 0), hours: hours };
}

function slotTimes_(date, label) {
  var p = parseSlot_(label);
  if (!p || p.h < CONFIG.OPEN_HOUR || p.h >= CONFIG.CLOSE_HOUR || p.min > 59) return null;
  var start = Utilities.parseDate(date + ' ' + pad_(p.h) + ':' + pad_(p.min), CONFIG.TZ, 'yyyy-MM-dd HH:mm');
  if (Utilities.formatDate(start, CONFIG.TZ, 'yyyy-MM-dd') !== date) return null;
  var isoDow = Number(Utilities.formatDate(start, CONFIG.TZ, 'u'));
  if (CONFIG.OPEN_DAYS.indexOf(isoDow) === -1) return null;
  return { start: start, end: new Date(start.getTime() + p.hours * 3600 * 1000), hours: p.hours };
}

/* ------------------------------------------------------------------ */

function rateOk_(email) {
  var n = Number(CacheService.getScriptCache().get('rate_' + email) || 0);
  return n < CONFIG.MAX_BOOKINGS_PER_EMAIL;
}

function bumpRate_(email) {
  var cache = CacheService.getScriptCache();
  var key = 'rate_' + email;
  cache.put(key, String(Number(cache.get(key) || 0) + 1), 6 * 3600);
}

/* ------------------------------------------------------------------ */

var MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
var DAYS_FR = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

function when_(slot, lang) {
  var tz = CONFIG.TZ;
  if (lang === 'fr') {
    var dow = Number(Utilities.formatDate(slot.start, tz, 'u')) - 1;
    var month = Number(Utilities.formatDate(slot.start, tz, 'M')) - 1;
    return DAYS_FR[dow] + ' ' + Utilities.formatDate(slot.start, tz, 'd') + ' ' + MONTHS_FR[month] + ' ' +
      Utilities.formatDate(slot.start, tz, 'yyyy') + ', ' +
      Utilities.formatDate(slot.start, tz, "H 'h' mm").replace(' h 00', ' h') + ' à ' +
      Utilities.formatDate(slot.end, tz, "H 'h' mm").replace(' h 00', ' h');
  }
  return Utilities.formatDate(slot.start, tz, 'EEEE, MMMM d, yyyy, HH:mm') + ' to ' + Utilities.formatDate(slot.end, tz, 'HH:mm');
}

function eventTitle_(d) {
  return 'Tattoo — ' + String(d.name).trim() + (d.style ? ' (' + d.style + ')' : '');
}

function rows_(d, slot) {
  return [
    ['When', when_(slot, 'en') + ' (' + slot.hours + ' h)'],
    ['Name', d.name],
    ['Email', d.email],
    ['Phone', d.phone || '—'],
    ['Instagram', d.instagram || '—'],
    ['Preferred contact', d.contact || '—'],
    ['First tattoo', d.firstTattoo || '—'],
    ['Idea', d.idea],
    ['Style', d.style || '—'],
    ['Size', d.size || '—'],
    ['Placement', d.placement || '—'],
    ['Ink', d.ink || '—'],
    ['Budget', d.budget || '—'],
    ['Reference photos', String((d.photos || []).length)],
    ['Language', d.lang === 'fr' ? 'Français' : 'English']
  ];
}

function detailsText_(d, slot) {
  return rows_(d, slot).map(function (r) { return r[0] + ': ' + r[1]; }).join('\n') +
    '\n\nBooked from the Skinreaper website.';
}

function artistEmail_() {
  return CONFIG.ARTIST_EMAIL || Session.getEffectiveUser().getEmail();
}

function sendClient_(d, slot) {
  var fr = d.lang === 'fr';
  var name = esc_(String(d.name).trim().split(/\s+/)[0]);
  var subject = fr
    ? 'Votre séance de tatouage est réservée — ' + when_(slot, 'fr')
    : 'Your tattoo session is booked — ' + when_(slot, 'en');
  var lines = fr ? [
    'Bonjour ' + name + ',',
    'Votre séance avec ' + esc_(CONFIG.ARTIST_NAME) + ' est confirmée.',
    '<strong>' + esc_(when_(slot, 'fr')) + '</strong><br>' + esc_(CONFIG.LOCATION),
    'Vous recevez aussi une invitation Google Agenda séparée.',
    'À apporter : une pièce d’identité avec photo valide. Mangez avant de venir, buvez de l’eau, pas d’alcool dans les 24 heures avant.',
    'Les modalités de dépôt et d’annulation vous seront confirmées par écrit. Pour toute question, ou pour donner des informations de santé, répondez simplement à ce courriel.',
    'À bientôt,<br>' + esc_(CONFIG.ARTIST_NAME)
  ] : [
    'Hi ' + name + ',',
    'Your session with ' + esc_(CONFIG.ARTIST_NAME) + ' is confirmed.',
    '<strong>' + esc_(when_(slot, 'en')) + '</strong><br>' + esc_(CONFIG.LOCATION),
    'You also get a separate Google Calendar invite.',
    'Bring a valid photo ID. Eat before you come, drink water, no alcohol for 24 hours before.',
    'Deposit and cancellation terms will be confirmed in writing. For any question, or to share health information, just reply to this email.',
    'See you soon,<br>' + esc_(CONFIG.ARTIST_NAME)
  ];
  MailApp.sendEmail({
    to: String(d.email).trim(),
    subject: subject,
    name: CONFIG.ARTIST_NAME,
    replyTo: artistEmail_(),
    htmlBody: wrapHtml_(lines.map(function (l) { return '<p>' + l + '</p>'; }).join('')),
    body: lines.join('\n\n').replace(/<[^>]+>/g, '')
  });
}

function sendArtist_(d, slot, event) {
  var attachments = (d.photos || []).slice(0, 4).map(function (ph, i) {
    var bytes = Utilities.base64Decode(String(ph.data || ''));
    return Utilities.newBlob(bytes, 'image/jpeg', String(ph.name || ('reference-' + (i + 1) + '.jpg')).slice(0, 80));
  }).filter(function (b) { return b.getBytes().length > 0 && b.getBytes().length < 5 * 1024 * 1024; });

  var table = rows_(d, slot).map(function (r) {
    return '<tr><td style="padding:6px 12px 6px 0;color:#666;vertical-align:top;white-space:nowrap;">' + esc_(r[0]) +
      '</td><td style="padding:6px 0;white-space:pre-wrap;">' + esc_(r[1]) + '</td></tr>';
  }).join('');

  MailApp.sendEmail({
    to: artistEmail_(),
    subject: 'New booking — ' + String(d.name).trim() + ' — ' + when_(slot, 'en'),
    name: 'Skinreaper website',
    replyTo: String(d.email).trim(),
    htmlBody: wrapHtml_('<p><strong>New booking from the website.</strong> It is already in your calendar and the client got an invite.</p>' +
      '<table style="border-collapse:collapse;font-size:14px;">' + table + '</table>' +
      (event ? '<p style="color:#666;font-size:12px;">Event id: ' + esc_(event.getId()) + '</p>' : '')),
    body: detailsText_(d, slot),
    attachments: attachments
  });
}

function wrapHtml_(inner) {
  return '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#111;max-width:560px;">' + inner + '</div>';
}

/* ------------------------------------------------------------------ */

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function esc_(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function pad_(n) {
  return (n < 10 ? '0' : '') + n;
}

/** Run once from the editor to grant permissions and check the calendar. */
function testSetup() {
  var cal = calendar_();
  console.log('Calendar: ' + cal.getName() + ' | Artist email: ' + artistEmail_());
  console.log(JSON.stringify(busy_(new Date().toISOString(), new Date(Date.now() + 14 * DAY_MS).toISOString())));
}
