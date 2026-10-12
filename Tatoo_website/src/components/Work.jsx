import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react';
import { useLang } from '../lib/lang.jsx';
import { useFinePointer } from '../lib/hooks.js';
import { CATS, WORKS } from '../config.js';
import { ClipReveal, EASE, SPRING, SplitText } from './motion.jsx';
import Lightbox from './Lightbox.jsx';

export default function Work({ onLightbox }) {
  const { t, lang } = useLang();
  const fine = useFinePointer();
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(-1);
  const [hover, setHover] = useState(false);
  const cx = useMotionValue(-100);
  const cy = useMotionValue(-100);
  const sx = useSpring(cx, { stiffness: 500, damping: 40, mass: 0.4 });
  const sy = useSpring(cy, { stiffness: 500, damping: 40, mass: 0.4 });

  const works = useMemo(() => WORKS.map(w => ({
    ...w,
    placeLabel: w.place[lang],
    catLabel: CATS[w.cat][lang],
    alt: `${t.work.alt}, ${w.place[lang].toLowerCase()}`
  })), [lang, t]);

  const gallery = filter === 'all' ? works : works.filter(w => w.cat === filter);
  const filters = [{ key: 'all', label: t.work.all, count: works.length }].concat(
    Object.keys(CATS).map(k => ({ key: k, label: CATS[k][lang], count: works.filter(w => w.cat === k).length }))
  );

  useEffect(() => { onLightbox(open >= 0); }, [open, onLightbox]);

  return (
    <section id="work" className="section">
      <div className="wrap">
        <div className="head">
          <SplitText as="h2" className="h2" text={t.work.title} />
          <div role="group" aria-label={t.work.filter} className="tabs">
            {filters.map(f => (
              <button
                key={f.key}
                type="button"
                className={`tab ${filter === f.key ? 'is-on' : ''}`}
                aria-pressed={filter === f.key}
                onClick={() => { setFilter(f.key); setOpen(-1); }}
              >
                {filter === f.key && <motion.span layoutId="tab-pill" className="tab-pill" transition={SPRING} />}
                <span className="tab-label">{f.label}<sup>{f.count}</sup></span>
              </button>
            ))}
          </div>
        </div>

        <ul
          className={`gallery ${fine ? 'has-cursor' : ''}`}
          onPointerMove={e => { cx.set(e.clientX); cy.set(e.clientY); }}
        >
          <AnimatePresence mode="popLayout">
            {gallery.map((w, i) => (
              <motion.li
                layout
                key={w.src}
                className="tile"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <ClipReveal className="tile-reveal" delay={(i % 4) * 0.08}>
                  <button
                    type="button"
                    className="tile-btn"
                    onClick={() => setOpen(i)}
                    onPointerEnter={() => setHover(true)}
                    onPointerLeave={() => setHover(false)}
                    aria-label={`${t.work.open}: ${w.alt}`}
                  >
                    <img src={w.src} alt={w.alt} loading="lazy" decoding="async" />
                    <span className="tile-info" aria-hidden="true">
                      <span>{w.placeLabel}</span>
                      <span>{w.catLabel}</span>
                    </span>
                  </button>
                </ClipReveal>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>

      {fine && (
        <motion.div
          className="cursor"
          aria-hidden="true"
          style={{ x: sx, y: sy }}
          animate={{ scale: hover && open < 0 ? 1 : 0, opacity: hover && open < 0 ? 1 : 0 }}
          transition={{ duration: 0.25, ease: EASE }}
        >
          {t.work.view}
        </motion.div>
      )}

      <AnimatePresence>
        {open >= 0 && gallery[open] && (
          <Lightbox items={gallery} index={open} setIndex={setOpen} onClose={() => setOpen(-1)} />
        )}
      </AnimatePresence>
    </section>
  );
}
