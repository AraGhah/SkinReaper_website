import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useLang } from '../lib/lang.jsx';
import { useDesktop } from '../lib/hooks.js';
import { AUTO, DICT } from '../dict.js';
import { EMAIL, IG_URL, LOCATION, PROPS, TZ } from '../config.js';
import { dateLabel, dowOf, gcalStamp, isClosedDow, slotsFor, tzParts, ymd, zonedToUtc } from '../lib/time.js';
import { copyText, resizeImage } from '../lib/image.js';
import { EASE, Reveal, SPRING, SplitText } from './motion.jsx';
import { Arrow, Btn, Cross, Spinner } from './ui.jsx';

function emptyForm() {
  return {
    idea: '', style: -1, size: -1, place: -1, color: -1, budget: -1,
    first: -1, pregnant: -1, acks: [false, false, false, false],
    name: '', email: '', phone: '', instagram: '', contact: -1, company: ''
  };
}

const stepMotion = {
  enter: d => ({ opacity: 0, x: d * 48 }),
  center: { opacity: 1, x: 0 },
  exit: d => ({ opacity: 0, x: d * -48 })
};

/* ---------- small pieces ---------- */
function FieldError({ msg }) {
  return (
    <AnimatePresence initial={false}>
      {msg && (
        <motion.p
          role="alert"
          className="err"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto', x: [0, -6, 6, -3, 3, 0] }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.4 }}
        >
          {msg}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

function Choice({ name, label, options, value, onPick, error }) {
  return (
    <fieldset className="field" aria-invalid={error ? 'true' : 'false'}>
      <legend className="label">{label} <span className="req">*</span></legend>
      <div className="chips">
        {options.map((o, i) => (
          <button key={o} type="button" className={`chip ${value === i ? 'is-on' : ''}`} aria-pressed={value === i} onClick={() => onPick(i)}>
            {value === i && <motion.span layoutId={`chip-${name}`} className="chip-bg" transition={SPRING} />}
            <span className="chip-label">{o}</span>
          </button>
        ))}
      </div>
      <FieldError msg={error} />
    </fieldset>
  );
}

function SummaryList({ rows }) {
  return (
    <dl className="summary">
      <AnimatePresence initial={false}>
        {rows.map(r => (
          <motion.div
            key={r.k}
            layout
            className="summary-row"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <dt>{r.k}</dt>
            <dd>{r.v}</dd>
          </motion.div>
        ))}
      </AnimatePresence>
    </dl>
  );
}

function Check() {
  return (
    <svg className="check" width="72" height="72" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <motion.circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease: EASE }} />
      <motion.path d="M7 12.5l3.2 3.2L17 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.6, ease: EASE }} />
    </svg>
  );
}

/* ---------- calendar ---------- */
function Calendar({ month, monthDir, date, busy, onPick, onShift }) {
  const { t, lang } = useLang();
  const b = t.book;
  const now = tzParts(new Date());
  const todayKey = ymd(now.y, now.m, now.d);
  const { y, m } = month;
  const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const nDays = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const monthIdx = y * 12 + m;
  const minIdx = now.y * 12 + now.m;
  const canPrev = monthIdx > minIdx;
  const canNext = monthIdx < minIdx + 6;
  const title = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-CA' : 'en-CA', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(y, m - 1, 1)));

  const cells = [];
  for (let k = 0; k < (firstDow + 6) % 7; k++) cells.push({ blank: true, key: `b${k}` });
  for (let day = 1; day <= nDays; day++) {
    const key = ymd(y, m, day);
    const closed = isClosedDow(dowOf(key));
    const past = key < todayKey;
    const full = !closed && !past && slotsFor(key, b.slotsWeek, b.slotsSat, busy).every(x => x.blocked);
    const aria = dateLabel(key, lang) + (closed ? `, ${b.closed}` : full ? `, ${b.fullDay}` : '');
    cells.push({ key, day, disabled: closed || past || full, full, selected: date === key, today: key === todayKey, aria });
  }

  return (
    <div className="cal">
      <div className="cal-head">
        <button type="button" className="cal-nav" onClick={() => onShift(-1)} disabled={!canPrev} aria-label={b.prevMonth}><Arrow dir="left" /></button>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={title} className="cal-title" aria-live="polite"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
            {title}
          </motion.p>
        </AnimatePresence>
        <button type="button" className="cal-nav" onClick={() => onShift(1)} disabled={!canNext} aria-label={b.nextMonth}><Arrow /></button>
      </div>
      <div className="cal-grid cal-dows" aria-hidden="true">
        {b.dows.map(w => <span key={w}>{w}</span>)}
      </div>
      <div className="cal-clip">
        <AnimatePresence mode="popLayout" initial={false} custom={monthDir}>
          <motion.div
            key={`${y}-${m}`}
            className="cal-grid"
            custom={monthDir}
            variants={stepMotion}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: EASE }}
          >
            {cells.map(c => c.blank ? <span key={c.key} /> : (
              <button
                key={c.key}
                type="button"
                className={`day ${c.selected ? 'is-on' : ''} ${c.today ? 'is-today' : ''} ${c.full ? 'is-full' : ''}`}
                disabled={c.disabled}
                aria-pressed={c.selected}
                aria-label={c.aria}
                onClick={() => onPick(c.key)}
              >
                {c.selected && <motion.span layoutId="day-pill" className="day-bg" transition={SPRING} />}
                <span className="day-num">{c.day}</span>
              </button>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------- main ---------- */
export default function Booking() {
  const { t, lang } = useLang();
  const b = t.book;
  const desktop = useDesktop();
  const reduce = useReducedMotion();
  const auto = !!PROPS.bookingUrl;
  const bk = auto ? { ...{ intro: b.intro, send: b.send, sending: b.sending }, ...AUTO[lang] } : { intro: b.intro, send: b.send, sending: b.sending };

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [f, setF] = useState(emptyForm);
  const [photos, setPhotos] = useState([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoMsg, setPhotoMsg] = useState('');
  const [month, setMonth] = useState(() => { const n = tzParts(new Date()); return { y: n.y, m: n.m }; });
  const [monthDir, setMonthDir] = useState(1);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState(-1);
  const [busy, setBusy] = useState([]);
  const [busyState, setBusyState] = useState('idle');
  const [err, setErr] = useState({});
  const [status, setStatus] = useState('');
  const [takenMsg, setTakenMsg] = useState(false);
  const [copied, setCopied] = useState(false);
  const busyByMonth = useRef({});
  const copyTimer = useRef(0);

  const scrollBehavior = reduce ? 'auto' : 'smooth';
  const scrollToForm = useCallback(() => {
    requestAnimationFrame(() => {
      const el = document.getElementById('book-form');
      if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
    });
  }, [scrollBehavior]);

  /* availability */
  const loadBusy = useCallback(async ({ y, m }) => {
    const source = PROPS.bookingUrl ? 'script' : (PROPS.gcalId && PROPS.gcalKey ? 'gcal' : '');
    if (!source) return;
    const key = `${y}-${m}`;
    if (busyByMonth.current[key]) return;
    const from = new Date(zonedToUtc(y, m, 1, 0, 0)).toISOString();
    const to = new Date(zonedToUtc(m === 12 ? y + 1 : y, m === 12 ? 1 : m + 1, 1, 0, 0)).toISOString();
    setBusyState('loading');
    try {
      let list;
      if (source === 'script') {
        const url = PROPS.bookingUrl + (PROPS.bookingUrl.includes('?') ? '&' : '?') +
          `action=busy&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
        const j = await (await fetch(url)).json();
        if (!j.ok) throw new Error(j.error || 'busy failed');
        list = (j.busy || []).map(x => [+x.start, +x.end]);
      } else {
        const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(PROPS.gcalId)}/events` +
          `?key=${encodeURIComponent(PROPS.gcalKey)}&timeMin=${encodeURIComponent(from)}&timeMax=${encodeURIComponent(to)}` +
          '&singleEvents=true&maxResults=250';
        const r = await fetch(url);
        if (!r.ok) throw new Error('gcal ' + r.status);
        const j = await r.json();
        list = (j.items || [])
          .filter(ev => ev.status !== 'cancelled' && ev.transparency !== 'transparent')
          .map(ev => {
            if (ev.start.dateTime) return [Date.parse(ev.start.dateTime), Date.parse(ev.end.dateTime)];
            const [sy, sm, sd] = ev.start.date.split('-').map(Number);
            const [ey, em, ed] = ev.end.date.split('-').map(Number);
            return [zonedToUtc(sy, sm, sd, 0, 0), zonedToUtc(ey, em, ed, 0, 0)];
          });
      }
      busyByMonth.current[key] = list;
      setBusy([].concat(...Object.values(busyByMonth.current)));
      setBusyState('ok');
    } catch (e) {
      console.warn('[skinreaper] availability', e);
      setBusyState('error');
    }
  }, []);

  useEffect(() => { loadBusy(month); }, [month, loadBusy]);

  /* derived */
  const slots = useMemo(() => slotsFor(date, b.slotsWeek, b.slotsSat, busy), [date, b, busy]);
  const selected = slots[slot] || null;
  const blocked = step === 3 && f.pregnant === 0;

  const summary = useMemo(() => {
    const opt = (list, i) => (i >= 0 ? list[i] : '');
    return [
      { k: b.idea, v: f.idea.trim() },
      { k: b.style, v: opt(b.styles, f.style) },
      { k: b.size, v: opt(b.sizes, f.size) },
      { k: b.place, v: opt(b.places, f.place) },
      { k: b.color, v: opt(b.colors, f.color) },
      { k: b.budget, v: opt(b.budgets, f.budget) },
      { k: b.sumPhotos, v: photos.length ? String(photos.length) : '' },
      { k: b.sumDate, v: dateLabel(date, lang, { year: 'numeric' }) },
      { k: b.sumTime, v: selected ? selected.label : '' },
      { k: b.first, v: opt(b.yesNo, f.first) },
      { k: b.sumName, v: f.name.trim() },
      { k: b.email, v: f.email.trim() },
      { k: b.phone, v: f.phone.trim() },
      { k: b.instagram, v: f.instagram.trim() },
      { k: b.contact, v: opt(b.contacts, f.contact) }
    ].filter(r => r.v);
  }, [b, f, photos.length, date, lang, selected]);

  const summaryText = () => b.mailSubject + '\n\n' + summary.map(r => `${r.k}: ${r.v}`).join('\n') +
    (photos.length ? `\n\n${photos.length} ${b.photosNote}` : '');

  /* form updates */
  const setForm = (patch, clear) => {
    setF(prev => ({ ...prev, ...patch }));
    setErr(prev => {
      const next = { ...prev };
      (clear || Object.keys(patch)).forEach(k => delete next[k]);
      return next;
    });
  };
  const pick = (key, i) => setForm({ [key]: i }, key === 'contact' ? ['contact', 'phone', 'instagram'] : [key]);

  const addPhotos = async e => {
    const input = e.target;
    const files = Array.from(input.files || []);
    input.value = '';
    if (!files.length) return;
    const next = photos.slice();
    let msg = '';
    setPhotoBusy(true);
    setPhotoMsg('');
    for (const file of files) {
      if (next.length >= 4) { msg = b.photoMax; break; }
      try { next.push(await resizeImage(file, 1200)); } catch (x) { msg = b.photoErr; }
    }
    setPhotos(next);
    setPhotoBusy(false);
    setPhotoMsg(msg);
  };

  const removePhoto = id => {
    setPhotos(prev => {
      const gone = prev.find(p => p.id === id);
      if (gone) URL.revokeObjectURL(gone.thumb);
      return prev.filter(p => p.id !== id);
    });
    setPhotoMsg('');
  };

  const pickDate = key => {
    setDate(key);
    setSlot(-1);
    setTakenMsg(false);
    setErr(prev => { const n = { ...prev }; delete n.date; return n; });
  };
  const pickSlot = i => {
    setSlot(i);
    setTakenMsg(false);
    setErr(prev => { const n = { ...prev }; delete n.date; return n; });
  };
  const shiftMonth = d => {
    const now = tzParts(new Date());
    let { y, m } = month;
    m += d;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    const idx = y * 12 + m, min = now.y * 12 + now.m;
    if (idx < min || idx > min + 6) return;
    setMonthDir(d);
    setMonth({ y, m });
  };

  /* validation and navigation */
  const validate = n => {
    const e = {};
    if (n === 1) {
      if (f.idea.trim().length < 10) e.idea = b.err.idea;
      ['style', 'size', 'place', 'color', 'budget'].forEach(k => { if (f[k] < 0) e[k] = b.err.pick; });
    }
    if (n === 2) {
      if (!date || !selected) e.date = b.err.date;
      else if (selected.blocked) e.date = b.taken;
      if (f.first < 0) e.first = b.err.pick;
    }
    if (n === 3) {
      if (f.pregnant < 0) e.pregnant = b.err.pick;
      if (f.acks.some(a => !a)) e.acks = b.err.acks;
      if (!f.name.trim()) e.name = b.err.name;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = b.err.email;
      if (f.contact < 0) e.contact = b.err.pick;
      if ((f.contact === 1 || f.contact === 2) && f.phone.replace(/\D/g, '').length < 7) e.phone = b.err.phone;
      if (f.contact === 3 && f.instagram.replace(/[@\s]/g, '').length < 2) e.instagram = b.err.instagram;
    }
    return e;
  };

  const submitStep = e => {
    e.preventDefault();
    if (status || blocked) return;
    const found = validate(step);
    if (Object.keys(found).length) {
      setErr(found);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const el = document.querySelector('#book-form [aria-invalid="true"]');
        if (el) el.scrollIntoView({ behavior: scrollBehavior, block: 'center' });
      }));
      return;
    }
    if (step === 3) { send(); return; }
    setDir(1);
    setStep(step + 1);
    setErr({});
    scrollToForm();
  };

  const prevStep = () => {
    setDir(-1);
    setStep(Math.max(1, step - 1));
    setErr({});
    scrollToForm();
  };

  /* sending */
  const calendarLink = sl => 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    `&text=${encodeURIComponent('Tattoo with ' + f.name.trim())}` +
    `&dates=${gcalStamp(sl.start)}/${gcalStamp(sl.end)}` +
    `&details=${encodeURIComponent(summaryText())}` +
    `&location=${encodeURIComponent(LOCATION)}&ctz=${encodeURIComponent(TZ)}`;

  const payload = () => ({
    lang,
    idea: f.idea.trim(),
    style: b.styles[f.style],
    size: b.sizes[f.size],
    placement: b.places[f.place],
    ink: b.colors[f.color],
    budget: b.budgets[f.budget],
    date,
    slot: selected.label,
    start: new Date(selected.start).toISOString(),
    end: new Date(selected.end).toISOString(),
    hours: selected.hours,
    dateLabel: dateLabel(date, lang, { year: 'numeric' }),
    firstTattoo: b.yesNo[f.first],
    pregnant: f.pregnant === 0,
    acknowledged: f.acks.every(Boolean),
    name: f.name.trim(),
    email: f.email.trim(),
    phone: f.phone.trim(),
    instagram: f.instagram.trim(),
    contact: b.contacts[f.contact],
    photos: photos.map(ph => ({ name: ph.name, type: 'image/jpeg', data: ph.data.split(',')[1] })),
    company: f.company,
    tz: TZ,
    page: location.href
  });

  async function send() {
    const data = payload();
    const sl = selected;
    setStatus('sending');
    setErr({});
    setCopied(false);
    scrollToForm();
    try {
      if (PROPS.bookingUrl) {
        const r = await fetch(PROPS.bookingUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(data)
        });
        const j = await r.json();
        if (j.ok) {
          busyByMonth.current = {};
          setStatus('booked');
          return;
        }
        if (j.error === 'slot_taken') {
          busyByMonth.current = {};
          setStatus('');
          setDir(-1);
          setStep(2);
          setSlot(-1);
          setTakenMsg(true);
          loadBusy(month);
          scrollToForm();
          return;
        }
        throw new Error(j.error || 'booking failed');
      }

      if (!PROPS.formEndpoint) throw new Error('no endpoint');
      const body = {
        _subject: `${DICT.en.book.mailSubject}: ${data.name}, ${data.dateLabel}, ${data.slot}`,
        _template: 'table',
        _captcha: 'false',
        _replyto: data.email,
        _honey: data.company,
        Name: data.name,
        Email: data.email,
        Phone: data.phone || 'not given',
        Instagram: data.instagram || 'not given',
        'Preferred contact': data.contact,
        Date: data.dateLabel,
        Time: `${data.slot} (${data.hours} h, ${TZ})`,
        'First tattoo': data.firstTattoo,
        Idea: data.idea,
        Style: data.style,
        Size: data.size,
        Placement: data.placement,
        Ink: data.ink,
        Budget: data.budget,
        'Reference photos': data.photos.length ? `${data.photos.length} chosen, ask the client to send them` : 'None',
        'Add to my calendar': calendarLink(sl),
        Language: data.lang === 'fr' ? 'Français' : 'English'
      };
      const r = await fetch(PROPS.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body)
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.success === false || j.success === 'false') throw new Error(j.message || 'form endpoint failed');
      setStatus('delivered');
    } catch (x) {
      console.warn('[skinreaper] send', x);
      setStatus('failed');
    }
  }

  const copyRequest = async () => {
    await copyText(summaryText());
    setCopied(true);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2500);
  };

  const retry = () => { setStatus(''); setStep(3); };

  const newRequest = () => {
    photos.forEach(ph => URL.revokeObjectURL(ph.thumb));
    setStatus(''); setStep(1); setDir(-1); setF(emptyForm()); setPhotos([]); setPhotoMsg('');
    setDate(''); setSlot(-1); setErr({}); setTakenMsg(false); setCopied(false);
    scrollToForm();
  };

  const mailtoHref = status === 'failed'
    ? `mailto:${EMAIL}?subject=${encodeURIComponent(b.mailSubject + ': ' + f.name.trim())}&body=${encodeURIComponent(summaryText().slice(0, 1800))}`
    : '';

  const needPhone = f.contact === 1 || f.contact === 2;
  const needIg = f.contact === 3;
  const inputs = [
    { key: 'name', label: b.name, type: 'text', auto: 'name', mode: 'text', ph: '', req: true },
    { key: 'email', label: b.email, type: 'email', auto: 'email', mode: 'email', ph: '', req: true },
    { key: 'phone', label: b.phone, type: 'tel', auto: 'tel', mode: 'tel', ph: '', req: needPhone },
    { key: 'instagram', label: b.instagram, type: 'text', auto: 'off', mode: 'text', ph: b.igPh, req: needIg }
  ];
  const isSat = date && dowOf(date) === 6;
  const hasErr = Object.keys(err).length > 0;
  const dLabel = dateLabel(date, lang);

  return (
    <section id="book" className="section book">
      <div className="wrap book-grid">
        <aside className="book-aside">
          <SplitText as="h2" className="h2" text={b.title} />
          <Reveal as="p" className="body book-intro">{bk.intro}</Reveal>
          {desktop && !status && summary.length > 0 && (
            <motion.div className="book-summary" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
              <p className="label">{b.summary}</p>
              <SummaryList rows={summary} />
            </motion.div>
          )}
        </aside>

        <Reveal id="book-form" className="form-card" y={40}>
          <AnimatePresence mode="wait" initial={false}>
            {status ? (
              <motion.div
                key={`status-${status}`}
                className="status"
                aria-live="polite"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                {status === 'sending' && (
                  <div className="status-sending"><Spinner /><p className="lead">{bk.sending}</p></div>
                )}
                {(status === 'booked' || status === 'delivered') && (
                  <>
                    <Check />
                    <h3 className="status-title">{status === 'booked' ? b.bookedTitle : b.deliveredTitle}</h3>
                    <p className="body">{status === 'booked' ? b.bookedText : b.deliveredText}</p>
                  </>
                )}
                {status === 'failed' && (
                  <>
                    <h3 className="status-title is-err">{b.failedTitle}</h3>
                    <p className="body">{b.failedText}</p>
                    <div className="row-btns">
                      <Btn href={mailtoHref}>{b.mailMe}</Btn>
                      <Btn href={IG_URL} external variant="ghost">{b.dm}</Btn>
                      <Btn variant="ghost" onClick={copyRequest}>{copied ? b.copied : b.copy}</Btn>
                    </div>
                  </>
                )}
                {status !== 'sending' && (
                  <>
                    <SummaryList rows={summary} />
                    <div className="row-btns">
                      {status === 'failed' && <Btn variant="ghost" onClick={retry}><Arrow dir="left" /> {b.edit}</Btn>}
                      <Btn variant="ghost" onClick={newRequest}>{b.again}</Btn>
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <ol className="stepper" aria-label={b.title}>
                  {b.steps.map((label, i) => {
                    const n = i + 1;
                    return (
                      <li key={label} className={n === step ? 'is-on' : n < step ? 'is-done' : ''} aria-current={n === step ? 'step' : undefined}>
                        <span className="stepper-track">
                          <motion.span className="stepper-fill" initial={false} animate={{ scaleX: n <= step ? 1 : 0 }} transition={{ duration: 0.6, ease: EASE }} />
                        </span>
                        <span className="stepper-label"><span className="mono">0{n}</span> {label}</span>
                      </li>
                    );
                  })}
                </ol>

                <form onSubmit={submitStep} noValidate>
                  <input
                    type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true"
                    value={f.company} onChange={e => setForm({ company: e.target.value })} className="honey"
                  />
                  <div className="step-clip">
                    <AnimatePresence mode="wait" initial={false} custom={dir}>
                      <motion.div
                        key={step}
                        custom={dir}
                        variants={stepMotion}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.4, ease: EASE }}
                      >
                        {step === 1 && (
                          <>
                            <div className="field">
                              <label htmlFor="f-idea" className="label">{b.idea} <span className="req">*</span></label>
                              <textarea
                                id="f-idea" rows={5} value={f.idea} placeholder={b.ideaPh}
                                aria-invalid={err.idea ? 'true' : 'false'}
                                className={`input textarea ${err.idea ? 'is-err' : ''}`}
                                onChange={e => setForm({ idea: e.target.value })}
                              />
                              <FieldError msg={err.idea} />
                            </div>
                            <Choice name="style" label={b.style} options={b.styles} value={f.style} onPick={i => pick('style', i)} error={err.style} />
                            <Choice name="size" label={b.size} options={b.sizes} value={f.size} onPick={i => pick('size', i)} error={err.size} />
                            <Choice name="place" label={b.place} options={b.places} value={f.place} onPick={i => pick('place', i)} error={err.place} />
                            <Choice name="color" label={b.color} options={b.colors} value={f.color} onPick={i => pick('color', i)} error={err.color} />
                            <Choice name="budget" label={b.budget} options={b.budgets} value={f.budget} onPick={i => pick('budget', i)} error={err.budget} />
                            <div className="field">
                              <span className="label">{b.refs}</span>
                              <p className="small hint">{b.refsHint}</p>
                              <div className="photos">
                                <AnimatePresence mode="popLayout">
                                  {photos.map(ph => (
                                    <motion.div
                                      key={ph.id}
                                      layout
                                      className="photo"
                                      initial={{ opacity: 0, scale: 0.6 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.6 }}
                                      transition={{ duration: 0.35, ease: EASE }}
                                    >
                                      <img src={ph.thumb} alt={ph.name} />
                                      <button type="button" className="photo-x" onClick={() => removePhoto(ph.id)} aria-label={`${b.remove} ${ph.name}`}><Cross /></button>
                                    </motion.div>
                                  ))}
                                  {photos.length < 4 && (
                                    <motion.label key="add" layout className="btn btn--ghost photo-add">
                                      <span>+ {b.addPhotos}</span>
                                      <input type="file" accept="image/*" multiple onChange={addPhotos} />
                                    </motion.label>
                                  )}
                                </AnimatePresence>
                              </div>
                              {photoBusy && <p className="small hint-after">{b.photoBusy}</p>}
                              <FieldError msg={photoMsg} />
                            </div>
                          </>
                        )}

                        {step === 2 && (
                          <>
                            <div className="field">
                              <span className="label">{b.when} <span className="req">*</span></span>
                              <Calendar month={month} monthDir={monthDir} date={date} busy={busy} onPick={pickDate} onShift={shiftMonth} />
                              <p className="small hint-after">{b.weekNote} {b.satNote} {b.tzNote}</p>
                              {busyState === 'loading' && <p className="small">{b.loading}</p>}
                              {busyState === 'error' && <p className="small is-err">{b.busyErr}</p>}
                              {takenMsg && <p role="alert" className="err">{b.taken}</p>}
                            </div>
                            <div className="field" aria-invalid={err.date ? 'true' : 'false'}>
                              <span className="label">
                                {b.pickSlot}{dLabel && <>: <span className="label-strong">{dLabel}</span></>}
                              </span>
                              {!date ? (
                                <p className="small">{b.noDay}</p>
                              ) : (
                                <div className={`slots ${isSat ? 'slots--wide' : ''}`}>
                                  {slots.map((sl, i) => (
                                    <motion.button
                                      key={`${date}-${sl.i}`}
                                      type="button"
                                      className={`slot ${sl.i === slot ? 'is-on' : ''}`}
                                      disabled={sl.blocked}
                                      aria-pressed={sl.i === slot}
                                      onClick={() => pickSlot(sl.i)}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                                    >
                                      {sl.i === slot && <motion.span layoutId="slot-pill" className="slot-bg" transition={SPRING} />}
                                      <span className="slot-label">
                                        {sl.label}
                                        {sl.blocked && <span className="slot-full">{b.full}</span>}
                                      </span>
                                    </motion.button>
                                  ))}
                                </div>
                              )}
                              <FieldError msg={err.date} />
                            </div>
                            <Choice name="first" label={b.first} options={b.yesNo} value={f.first} onPick={i => pick('first', i)} error={err.first} />
                          </>
                        )}

                        {step === 3 && (
                          <>
                            <Choice name="pregnant" label={b.pregnant} options={b.yesNo} value={f.pregnant} onPick={i => pick('pregnant', i)} error={err.pregnant} />
                            <AnimatePresence mode="wait" initial={false}>
                              {blocked ? (
                                <motion.div key="blocked" role="alert" className="warn"
                                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}>
                                  <span className="warn-mark" aria-hidden="true">!</span>
                                  <p className="body">{b.pregnantBlock}</p>
                                </motion.div>
                              ) : (
                                <motion.div key="rest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                                  <fieldset className="field" aria-invalid={err.acks ? 'true' : 'false'}>
                                    <legend className="label">{b.acksTitle} <span className="req">*</span></legend>
                                    {b.acks.map((label, i) => (
                                      <label key={i} className="check-row">
                                        <input
                                          type="checkbox"
                                          checked={f.acks[i]}
                                          onChange={e => { const acks = f.acks.slice(); acks[i] = e.target.checked; setForm({ acks }); }}
                                        />
                                        <span className="box" aria-hidden="true">
                                          <svg viewBox="0 0 16 16"><path d="M3 8.5l3 3L13 5" /></svg>
                                        </span>
                                        <span>{label}</span>
                                      </label>
                                    ))}
                                    <FieldError msg={err.acks} />
                                  </fieldset>
                                  <div className="grid2">
                                    {inputs.map(inp => (
                                      <div className="field" key={inp.key}>
                                        <label htmlFor={`f-${inp.key}`} className="label">
                                          {inp.label} <span className="req">{inp.req ? '*' : `(${b.optional})`}</span>
                                        </label>
                                        <input
                                          id={`f-${inp.key}`}
                                          type={inp.type}
                                          autoComplete={inp.auto}
                                          inputMode={inp.mode}
                                          placeholder={inp.ph}
                                          value={f[inp.key]}
                                          aria-invalid={err[inp.key] ? 'true' : 'false'}
                                          className={`input ${err[inp.key] ? 'is-err' : ''}`}
                                          onChange={e => setForm({ [inp.key]: e.target.value })}
                                        />
                                        <FieldError msg={err[inp.key]} />
                                      </div>
                                    ))}
                                  </div>
                                  <Choice name="contact" label={b.contact} options={b.contacts} value={f.contact} onPick={i => pick('contact', i)} error={err.contact} />
                                  <p className="small privacy">{b.privacy}</p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <FieldError msg={hasErr ? b.err.fix : ''} />
                  <div className="form-bar">
                    {step > 1 ? (
                      <Btn variant="ghost" onClick={prevStep}><Arrow dir="left" /> {b.back}</Btn>
                    ) : <span />}
                    <span className="small form-step">{b.stepWord} {step} / 3</span>
                    <Btn type="submit" disabled={blocked} arrow={step < 3}>
                      {step === 3 ? bk.send : b.next}
                    </Btn>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </Reveal>
      </div>
    </section>
  );
}
