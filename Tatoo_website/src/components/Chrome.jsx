import { useEffect } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { EASE } from './motion.jsx';

const WORD = 'SKINREAPER';

export function shouldSkipIntro() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  try { return sessionStorage.getItem('sr_intro') === '1'; } catch (e) { return true; }
}

/* Short brand curtain, shown once per browser session */
export function Intro({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      try { sessionStorage.setItem('sr_intro', '1'); } catch (e) { /* storage blocked */ }
      onDone();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      className="intro"
      aria-hidden="true"
      initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
      transition={{ duration: 0.9, ease: EASE }}
    >
      <div className="intro-word">
        {WORD.split('').map((c, i) => (
          <span className="mask" key={i}>
            <motion.span
              className={`mask-in ${i >= 4 ? 'intro-dim' : ''}`}
              initial={{ y: '110%' }}
              animate={{ y: '0%' }}
              transition={{ delay: 0.1 + i * 0.045, duration: 0.8, ease: EASE }}
            >
              {c}
            </motion.span>
          </span>
        ))}
      </div>
      <motion.span
        className="intro-line"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.3, ease: EASE }}
      />
    </motion.div>
  );
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  return <motion.div className="progress" style={{ scaleX }} aria-hidden="true" />;
}
