import { useCallback, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { LangProvider, useLang } from './lib/lang.jsx';
import { useScrollLock } from './lib/hooks.js';
import { Intro, ScrollProgress, shouldSkipIntro } from './components/Chrome.jsx';
import Nav from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import Marquee from './components/Marquee.jsx';
import Work from './components/Work.jsx';
import Booking from './components/Booking.jsx';
import { About, Faq, Footer, MobileBar, Pricing, Studio } from './components/Sections.jsx';

function Site() {
  const { t } = useLang();
  const [ready, setReady] = useState(shouldSkipIntro);
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const onIntroDone = useCallback(() => setReady(true), []);

  useScrollLock(menuOpen || lightbox || !ready);

  return (
    <>
      <a href="#main" className="skip">{t.nav.skip}</a>
      <AnimatePresence>{!ready && <Intro onDone={onIntroDone} />}</AnimatePresence>
      <ScrollProgress />
      <Nav menuOpen={menuOpen} setMenuOpen={setMenuOpen} ready={ready} />
      <main id="main">
        <Hero ready={ready} />
        <Marquee />
        <Work onLightbox={setLightbox} />
        <About />
        <Pricing />
        <Faq />
        <Booking />
        <Studio />
      </main>
      <Footer />
      <MobileBar hidden={menuOpen || lightbox} />
      <div className="grain" aria-hidden="true" />
    </>
  );
}

export default function App() {
  return (
    <LangProvider>
      <MotionConfig reducedMotion="user">
        <Site />
      </MotionConfig>
    </LangProvider>
  );
}
