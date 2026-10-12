import { useEffect, useRef, useState } from 'react';
import {
  animate, motion, stagger, useInView, useReducedMotion, useScroll, useSpring, useTransform
} from 'motion/react';
import { useFinePointer } from '../lib/hooks.js';

export const EASE = [0.22, 1, 0.36, 1];
export const SPRING = { type: 'spring', stiffness: 420, damping: 36 };

export function Reveal({ as = 'div', delay = 0, y = 28, amount = 0.2, className, children, ...rest }) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.9, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

const wordVariants = {
  hidden: { y: '110%' },
  show: { y: '0%', transition: { duration: 0.9, ease: EASE } }
};

/* Headline revealed word by word behind a mask. Pass `play` to drive it manually instead of on scroll. */
export function SplitText({ text, as = 'h2', className, delay = 0, each = 0.07, play }) {
  const Tag = motion[as];
  const words = text.split(' ');
  const driven = play !== undefined;
  return (
    <Tag
      key={text}
      className={className}
      aria-label={text}
      initial="hidden"
      {...(driven ? { animate: play ? 'show' : 'hidden' } : { whileInView: 'show', viewport: { once: true, amount: 0.6 } })}
      variants={{ hidden: {}, show: { transition: { delayChildren: stagger(each, { startDelay: delay }) } } }}
    >
      {words.map((w, i) => (
        <span key={i} aria-hidden="true">
          <span className="mask"><motion.span className="mask-in" variants={wordVariants}>{w}</motion.span></span>
          {i < words.length - 1 ? ' ' : null}
        </span>
      ))}
    </Tag>
  );
}

const CLIP_HIDDEN = { clipPath: 'inset(100% 0% 0% 0%)' };
const CLIP_SHOWN = { clipPath: 'inset(0% 0% 0% 0%)' };

/* Wipes its content open on first view. The observed box must stay unclipped:
   Chromium reports an intersection ratio of 0 for an element hidden by its own clip-path. */
export function ClipReveal({ className, delay = 0, duration = 1, amount = 0.15, children }) {
  const ref = useRef(null);
  const seen = useInView(ref, { once: true, amount });
  const reduce = useReducedMotion();
  return (
    <div ref={ref} className={className}>
      <motion.div
        className="clip-in"
        initial={reduce ? false : CLIP_HIDDEN}
        animate={seen ? CLIP_SHOWN : undefined}
        transition={{ duration, ease: EASE, delay }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* Image that wipes open on first view and drifts inside its frame while scrolling */
export function ParallaxImg({ src, alt, className = '', strength = 8, priority = false, children }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const seen = useInView(ref, { once: true, amount: 0.2 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${strength}%`, `${strength}%`]);
  return (
    <div ref={ref} className={`frame ${className}`}>
      <motion.div
        className="frame-clip"
        initial={reduce ? false : CLIP_HIDDEN}
        animate={seen ? CLIP_SHOWN : undefined}
        transition={{ duration: 1.3, ease: EASE }}
      >
        <motion.img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className="frame-img"
          style={reduce ? undefined : { y, scale: 1 + (strength * 2.2) / 100 }}
        />
        {children}
      </motion.div>
    </div>
  );
}

/* Pulls its child slightly toward the pointer (desktop only) */
export function Magnetic({ children, strength = 0.25, className = '' }) {
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const x = useSpring(0, { stiffness: 220, damping: 16, mass: 0.5 });
  const y = useSpring(0, { stiffness: 220, damping: 16, mass: 0.5 });
  if (!fine || reduce) return <span className={`magnetic ${className}`}>{children}</span>;
  return (
    <motion.span
      ref={ref}
      className={`magnetic ${className}`}
      style={{ x, y }}
      onPointerMove={e => {
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => { x.set(0); y.set(0); }}
    >
      {children}
    </motion.span>
  );
}

/* Counts the first number in a string up from zero when it scrolls into view */
export function CountUp({ value, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.8 });
  const reduce = useReducedMotion();
  const match = /\d+/.exec(value);
  const target = match ? +match[0] : 0;
  const [n, setN] = useState(reduce || !match ? target : 0);

  useEffect(() => {
    if (!inView || reduce || !match) { setN(target); return undefined; }
    const controls = animate(0, target, { duration: 1.4, ease: EASE, onUpdate: v => setN(Math.round(v)) });
    return () => controls.stop();
  }, [inView, reduce, target]); // eslint-disable-line react-hooks/exhaustive-deps

  const text = match ? value.replace(match[0], String(n)) : value;
  return <span ref={ref} className={className} aria-label={value}><span aria-hidden="true">{text}</span></span>;
}
