import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useLang } from '../lib/lang.jsx';
import { EASE } from './motion.jsx';
import { Arrow, Cross } from './ui.jsx';

const slide = {
  enter: d => ({ x: d > 0 ? 140 : d < 0 ? -140 : 0, opacity: 0, scale: d ? 1 : 0.94 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: d => ({ x: d > 0 ? -140 : 140, opacity: 0 })
};

const pad = n => String(n).padStart(2, '0');

export default function Lightbox({ items, index, setIndex, onClose }) {
  const { t } = useLang();
  const [dir, setDir] = useState(0);
  const closeRef = useRef(null);
  const thumbsRef = useRef(null);
  const item = items[index];

  const goTo = next => {
    setDir(next > index ? 1 : -1);
    setIndex((next + items.length) % items.length);
  };
  const go = d => { setDir(d); setIndex((index + d + items.length) % items.length); };

  useEffect(() => {
    const last = document.activeElement;
    closeRef.current?.focus();
    return () => last?.focus?.({ preventScroll: true });
  }, []);

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    const el = thumbsRef.current?.children[index];
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [index]);

  return (
    <motion.div
      className="lb"
      role="dialog"
      aria-modal="true"
      aria-label={t.work.title}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <div className="lb-top">
        <p className="lb-meta">
          <span className="mono">{pad(index + 1)} / {pad(items.length)}</span>
          <span>{item.placeLabel}, {item.catLabel}</span>
        </p>
        <button ref={closeRef} type="button" className="lb-close" onClick={onClose}>
          {t.work.close} <Cross />
        </button>
      </div>

      <div className="lb-stage" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <AnimatePresence initial={true} custom={dir} mode="popLayout">
          <motion.img
            key={item.src}
            src={item.src}
            alt={item.alt}
            className="lb-img"
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.55, ease: EASE }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={(e, info) => {
              if (info.offset.x < -80 || info.velocity.x < -500) go(1);
              else if (info.offset.x > 80 || info.velocity.x > 500) go(-1);
            }}
            draggable={false}
          />
        </AnimatePresence>
      </div>

      <div className="lb-bar">
        <button type="button" className="lb-nav" onClick={() => go(-1)} aria-label={t.work.prev}>
          <Arrow dir="left" /><span>{t.work.prev}</span>
        </button>
        <div className="lb-thumbs" ref={thumbsRef}>
          {items.map((w, i) => (
            <button
              key={w.src}
              type="button"
              className={i === index ? 'is-on' : ''}
              aria-current={i === index ? 'true' : undefined}
              aria-label={`${t.work.open}: ${w.alt}`}
              onClick={() => goTo(i)}
            >
              <img src={w.src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
        <button type="button" className="lb-nav" onClick={() => go(1)} aria-label={t.work.next}>
          <span>{t.work.next}</span><Arrow />
        </button>
      </div>
    </motion.div>
  );
}
