import { useRef } from 'react';
import { motion, stagger, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useLang } from '../lib/lang.jsx';
import { CATS, HERO_IMG, WORKS } from '../config.js';
import { EASE, Magnetic } from './motion.jsx';
import { Btn } from './ui.jsx';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } }
};

export default function Hero({ ready }) {
  const { t, lang } = useLang();
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['0%', '16%']);
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -110]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const play = ready ? 'show' : 'hidden';
  const cover = WORKS.find(w => w.src === HERO_IMG) || WORKS[0];

  return (
    <section id="top" className="hero" ref={ref}>
      <div className="wrap hero-grid">
        <motion.div className="hero-copy" style={reduce ? undefined : { y: copyY, opacity: copyOpacity }}>
          <motion.div
            initial="hidden"
            animate={play}
            variants={{ hidden: {}, show: { transition: { delayChildren: stagger(0.08, { startDelay: 0.1 }) } } }}
          >
            <motion.p className="eyebrow" variants={fadeUp}>
              <span className="eyebrow-dot" aria-hidden="true" />
              {t.hero.kicker}
            </motion.p>
          </motion.div>

          <h1 className="h1" aria-label={t.hero.lines.join(' ')}>
            {t.hero.lines.map((line, i) => (
              <span className="mask mask--line" key={`${lang}-${i}`} aria-hidden="true">
                <motion.span
                  className="mask-in"
                  initial={{ y: '110%' }}
                  animate={{ y: ready ? '0%' : '110%' }}
                  transition={{ delay: 0.25 + i * 0.12, duration: 1.1, ease: EASE }}
                >
                  {i === 1 ? <em>{line}</em> : line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.div
            className="hero-foot"
            initial="hidden"
            animate={play}
            variants={{ hidden: {}, show: { transition: { delayChildren: stagger(0.1, { startDelay: 0.7 }) } } }}
          >
            <motion.p className="lead" variants={fadeUp}>{t.hero.sub}</motion.p>
            <motion.div className="hero-cta" variants={fadeUp}>
              <Magnetic><Btn href="#book" arrow>{t.hero.cta}</Btn></Magnetic>
              <Btn href="#work" variant="ghost">{t.hero.cta2}</Btn>
            </motion.div>
            <motion.ul className="hero-meta" variants={fadeUp}>
              {t.hero.meta.map(m => <li key={m}>{m}</li>)}
            </motion.ul>
          </motion.div>
        </motion.div>

        <motion.figure
          className="hero-media"
          initial={reduce ? false : { clipPath: 'inset(100% 0% 0% 0%)' }}
          animate={ready ? { clipPath: 'inset(0% 0% 0% 0%)' } : undefined}
          transition={{ duration: 1.4, ease: EASE, delay: 0.15 }}
        >
          <motion.div className="hero-par" style={reduce ? undefined : { y: imgY, scale: imgScale }}>
            <motion.img
              src={HERO_IMG}
              alt={t.hero.alt}
              fetchPriority="high"
              initial={reduce ? false : { scale: 1.3 }}
              animate={ready ? { scale: 1 } : undefined}
              transition={{ duration: 1.8, ease: EASE, delay: 0.15 }}
            />
          </motion.div>
          <motion.figcaption
            className="hero-cap"
            initial={{ opacity: 0, y: 10 }}
            animate={ready ? { opacity: 1, y: 0 } : undefined}
            transition={{ delay: 1.2, duration: 0.8, ease: EASE }}
          >
            <span>{cover.place[lang]}</span>
            <span>{CATS[cover.cat][lang]}</span>
          </motion.figcaption>
        </motion.figure>
      </div>

      <motion.a
        href="#work"
        className="scroll-cue"
        initial={{ opacity: 0 }}
        animate={{ opacity: ready ? 1 : 0 }}
        transition={{ delay: 1.6, duration: 0.8 }}
      >
        <span>{t.hero.scroll}</span>
        <span className="scroll-cue-line" aria-hidden="true" />
      </motion.a>
    </section>
  );
}
