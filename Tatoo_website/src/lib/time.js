import { TZ } from '../config.js';

/* Everything is computed in the studio time zone */
const tzFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
});

export function tzParts(date) {
  const p = {};
  tzFmt.formatToParts(date).forEach(x => { p[x.type] = x.value; });
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, min: +p.minute, s: +p.second };
}

const utcCache = new Map();
export function zonedToUtc(y, m, d, h, min) {
  const key = `${y}-${m}-${d}-${h}-${min}`;
  if (utcCache.has(key)) return utcCache.get(key);
  const guess = Date.UTC(y, m - 1, d, h, min);
  const offsetAt = t => {
    const p = tzParts(new Date(t));
    return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s) - t;
  };
  const first = guess - offsetAt(guess);
  const result = guess - offsetAt(first);
  utcCache.set(key, result);
  return result;
}

const pad2 = n => String(n).padStart(2, '0');
export const ymd = (y, m, d) => `${y}-${pad2(m)}-${pad2(d)}`;

export function parseSlot(label) {
  const m = /^\s*(\d{1,2})\s*(?::|h)\s*(\d{2})?/i.exec(label) || [null, 11, 0];
  const l = label.toLowerCase();
  const hours = /full day|journée complète|journee complete/.test(l) ? 8 : /half day|demi/.test(l) ? 4 : 2;
  return { h: +m[1], min: +(m[2] || 0), hours };
}

export function gcalStamp(ms) {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export const dowOf = key => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

export const isClosedDow = dow => dow === 0 || dow === 1;

export function dateLabel(key, lang, opts) {
  if (!key) return '';
  const [y, m, d] = key.split('-').map(Number);
  const locale = lang === 'fr' ? 'fr-CA' : 'en-CA';
  return new Intl.DateTimeFormat(locale, Object.assign({ weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }, opts))
    .format(new Date(Date.UTC(y, m - 1, d)));
}

export function slotsFor(key, labelsWeek, labelsSat, busy) {
  if (!key) return [];
  const [y, m, d] = key.split('-').map(Number);
  const dow = dowOf(key);
  const labels = dow === 6 ? labelsSat : (isClosedDow(dow) ? [] : labelsWeek);
  const now = Date.now();
  return labels.map((label, i) => {
    const { h, min, hours } = parseSlot(label);
    const start = zonedToUtc(y, m, d, h, min);
    const end = start + hours * 3600e3;
    const blocked = start <= now || busy.some(x => x[0] < end && x[1] > start);
    return { i, label, start, end, hours, blocked };
  });
}
