import { useRef, useState } from 'react';
import { AnimatePresence, motion, stagger } from 'motion/react';
import { useLang } from '../lib/lang.jsx';
import { useDesktop, useInViewId } from '../lib/hooks.js';
import { ABOUT_IMG, EMAIL, IG_HANDLE, IG_URL, MAP_EMBED, MAPS_URL, STUDIO_IMG } from '../config.js';
import { CountUp, EASE, Magnetic, ParallaxImg, Reveal, SplitText } from './motion.jsx';
import { Arrow, Btn } from './ui.jsx';

const list = {
  hidden: {},
  show: { transition: { delayChildren: stagger(0.08) } }
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } }
};

/* ---------- About ---------- */
export function About() {
  const { t } = useLang();
  return (
    <section id="about" className="section">
      <div className="wrap about-grid">
        <ParallaxImg src={ABOUT_IMG} alt={t.about.alt} className="about-media" />
        <div className="about-copy">
          <SplitText as="h2" className="h2" text={t.about.title} />
          <Reveal as="p" className="lead about-lead">{t.about.lead}</Reveal>
          <Reveal as="p" className="body about-body" delay={0.1}>{t.about.body}</Reveal>
          <motion.ul
            className="pills"
            aria-label={t.about.stylesLabel}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.5 }}
            variants={list}
          >
            {t.about.styles.map(s => <motion.li key={s} className="pill" variants={item}>{s}</motion.li>)}
          </motion.ul>
          <Reveal className="about-link" delay={0.2}>
            <a href={IG_URL} target="_blank" rel="noopener" className="link">
              {IG_HANDLE} <Arrow dir="upRight" />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------- Pricing ---------- */
function RateCard({ r }) {
  const ref = useRef(null);
  const onMove = e => {
    const b = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--mx', `${e.clientX - b.left}px`);
    ref.current.style.setProperty('--my', `${e.clientY - b.top}px`);
  };
  return (
    <motion.li ref={ref} className="rate" variants={item} onPointerMove={onMove} whileHover={{ y: -6 }} transition={{ duration: 0.35, ease: EASE }}>
      <p className="rate-k">{r.k}</p>
      <p className="rate-v"><CountUp value={r.v} /></p>
      <p className="rate-d">{r.d}</p>
    </motion.li>
  );
}

export function Pricing() {
  const { t } = useLang();
  return (
    <section id="pricing" className="section">
      <div className="wrap">
        <div className="head">
          <SplitText as="h2" className="h2" text={t.pricing.title} />
          <Reveal as="p" className="body head-note">{t.pricing.intro}</Reveal>
        </div>
        <motion.ul className="rates" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={list}>
          {t.pricing.rates.map(r => <RateCard key={r.k} r={r} />)}
        </motion.ul>
        <Reveal as="p" className="small rates-note">{t.pricing.note}</Reveal>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */
export function Faq() {
  const { t } = useLang();
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="section">
      <div className="wrap faq-grid">
        <div className="faq-side">
          <SplitText as="h2" className="h2" text={t.faq.title} />
          <Reveal as="p" className="body">{t.faq.intro}</Reveal>
          <Reveal delay={0.1}><Btn href="#book" variant="ghost" arrow>{t.hero.cta}</Btn></Reveal>
        </div>
        <motion.div className="faq-list" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} variants={list}>
          {t.faq.items.map((q, i) => {
            const on = open === i;
            return (
              <motion.div key={i} className={`faq-item ${on ? 'is-open' : ''}`} variants={item}>
                <h3>
                  <button
                    type="button"
                    id={`faq-q${i}`}
                    className="faq-q"
                    aria-expanded={on}
                    aria-controls={`faq-a${i}`}
                    onClick={() => setOpen(on ? -1 : i)}
                  >
                    <span>{q.q}</span>
                    <span className="faq-icon" aria-hidden="true"><i /><i /></span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div
                      id={`faq-a${i}`}
                      role="region"
                      aria-labelledby={`faq-q${i}`}
                      className="faq-a"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.45, ease: EASE }}
                    >
                      <p>{q.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ---------- Studio ---------- */
export function Studio() {
  const { t } = useLang();
  return (
    <section id="studio" className="section">
      <div className="wrap">
        <div className="head">
          <SplitText as="h2" className="h2" text={t.studio.title} />
          <Reveal as="p" className="body head-note">{t.studio.note}</Reveal>
        </div>
        <div className="studio-grid">
          <ParallaxImg src={STUDIO_IMG} alt={t.studio.alt} className="studio-media" strength={6} />
          <div className="studio-info">
            <motion.div className="studio-facts" initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }} variants={list}>
              <motion.div variants={item}>
                <p className="label">{t.studio.addressTitle}</p>
                <address>{t.studio.address.map(ln => <span key={ln}>{ln}</span>)}</address>
              </motion.div>
              <motion.div variants={item}>
                <p className="label">{t.studio.hoursTitle}</p>
                <p className="body">{t.studio.pending}</p>
              </motion.div>
            </motion.div>
            <Reveal className="map">
              <iframe title={t.studio.mapTitle} src={MAP_EMBED} loading="lazy" referrerPolicy="no-referrer" />
            </Reveal>
            <Reveal delay={0.1}>
              <Btn href={MAPS_URL} external arrow="upRight">{t.studio.directions}</Btn>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */
export function Footer() {
  const { t } = useLang();
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-cta">
          <SplitText as="p" className="footer-title" text={t.footer.cta} />
          <Reveal delay={0.2}>
            <Magnetic><Btn href="#book" arrow>{t.hero.cta}</Btn></Magnetic>
          </Reveal>
        </div>
        <div className="footer-row">
          <div>
            <p className="logo">Skin<span>reaper</span></p>
            <p className="small footer-tag">{t.footer.tagline}</p>
          </div>
          <div className="footer-links">
            <a href={`mailto:${EMAIL}`} className="link">{EMAIL}</a>
            <a href={IG_URL} target="_blank" rel="noopener" className="link">{IG_HANDLE}</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="small">{t.footer.rights}</p>
          <p className="small footer-bottom-right">
            <span>{t.footer.age}</span>
            <a href="#top" className="link">{t.footer.top} <Arrow dir="up" /></a>
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ---------- Mobile bottom bar ---------- */
export function MobileBar({ hidden }) {
  const { t } = useLang();
  const desktop = useDesktop();
  const bookVisible = useInViewId('book');
  const show = !desktop && !bookVisible && !hidden;
  return (
    <AnimatePresence>
      {show && (
        <motion.nav
          className="bar"
          aria-label={t.bar.label}
          initial={{ y: '110%' }}
          animate={{ y: '0%' }}
          exit={{ y: '110%' }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          <a href="#book" className="bar-main">{t.bar.book}</a>
          <a href={IG_URL} target="_blank" rel="noopener">{t.bar.instagram}</a>
          <a href={MAPS_URL} target="_blank" rel="noopener">{t.bar.map}</a>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
