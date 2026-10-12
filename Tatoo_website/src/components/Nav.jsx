import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { useLang } from '../lib/lang.jsx';
import { useActiveSection, useDesktop } from '../lib/hooks.js';
import { IG_URL, SECTIONS } from '../config.js';
import { EASE, SPRING } from './motion.jsx';
import { Btn } from './ui.jsx';

const SPY = [...SECTIONS, 'book'];

function LangToggle() {
  const { lang, setLang, t } = useLang();
  return (
    <div className="lang" role="group" aria-label={t.nav.lang}>
      {['en', 'fr'].map(l => (
        <button key={l} type="button" lang={l} aria-pressed={lang === l} onClick={() => setLang(l)} className={lang === l ? 'is-on' : ''}>
          {lang === l && <motion.span layoutId="lang-pill" className="lang-pill" transition={SPRING} />}
          <span className="lang-label">{l.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}

function MobileMenu({ onClose }) {
  const { t } = useLang();

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      id="menu"
      className="menu"
      role="dialog"
      aria-modal="true"
      aria-label={t.nav.menu}
      initial={{ clipPath: 'circle(0% at 100% 0%)' }}
      animate={{ clipPath: 'circle(150% at 100% 0%)' }}
      exit={{ clipPath: 'circle(0% at 100% 0%)' }}
      transition={{ duration: 0.75, ease: EASE }}
    >
      <nav aria-label={t.nav.main} className="menu-links">
        {SPY.map((id, i) => (
          <span className="mask" key={id}>
            <motion.a
              href={`#${id}`}
              onClick={onClose}
              className="menu-link mask-in"
              initial={{ y: '110%' }}
              animate={{ y: '0%' }}
              exit={{ y: '110%', transition: { duration: 0.3 } }}
              transition={{ delay: 0.2 + i * 0.05, duration: 0.7, ease: EASE }}
            >
              {t.nav[id]}
            </motion.a>
          </span>
        ))}
      </nav>
      <motion.div
        className="menu-foot"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.5, duration: 0.6, ease: EASE }}
      >
        <Btn href="#book" onClick={onClose} block arrow>{t.hero.cta}</Btn>
        <Btn href={IG_URL} external variant="ghost" block arrow="upRight">Instagram</Btn>
      </motion.div>
    </motion.div>
  );
}

export default function Nav({ menuOpen, setMenuOpen, ready }) {
  const { t } = useLang();
  const desktop = useDesktop();
  const active = useActiveSection(SPY);
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);

  useMotionValueEvent(scrollY, 'change', y => {
    const prev = scrollY.getPrevious() ?? 0;
    setSolid(y > 24);
    if (y > 480 && y > prev + 4) setHidden(true);
    else if (y < prev - 4 || y < 480) setHidden(false);
  });

  useEffect(() => { if (desktop) setMenuOpen(false); }, [desktop, setMenuOpen]);

  const up = ready && (!hidden || menuOpen);

  return (
    <>
      <motion.header
        className={`nav ${solid && !menuOpen ? 'is-solid' : ''}`}
        initial={{ y: '-110%' }}
        animate={{ y: up ? '0%' : '-110%' }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <div className="wrap nav-inner">
          <a href="#top" className="logo" onClick={() => setMenuOpen(false)} aria-label="Skinreaper">
            Skin<span>reaper</span>
          </a>

          {desktop && (
            <nav className="nav-links" aria-label={t.nav.main}>
              {SECTIONS.map(id => (
                <a key={id} href={`#${id}`} className={active === id ? 'is-active' : ''} aria-current={active === id ? 'location' : undefined}>
                  {active === id && <motion.span layoutId="nav-pill" className="nav-pill" transition={SPRING} />}
                  <span className="nav-label">{t.nav[id]}</span>
                </a>
              ))}
            </nav>
          )}

          <div className="nav-right">
            <LangToggle />
            {desktop ? (
              <Btn href="#book" size="sm" arrow>{t.nav.book}</Btn>
            ) : (
              <button
                type="button"
                className="menu-btn"
                aria-expanded={menuOpen}
                aria-controls="menu"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <span className="burger" data-open={menuOpen}><i /><i /></span>
                <span className="sr-only">{menuOpen ? t.nav.close : t.nav.menu}</span>
              </button>
            )}
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {!desktop && menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
