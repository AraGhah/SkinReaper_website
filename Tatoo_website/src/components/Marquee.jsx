import { useRef } from 'react';
import {
  motion, useAnimationFrame, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, useVelocity, wrap
} from 'motion/react';
import { useLang } from '../lib/lang.jsx';
import { Sigil } from './ui.jsx';

const COPIES = 4;

/* Endless band of styles. Scrolling speeds it up and flips its direction. */
export default function Marquee({ speed = 2.2 }) {
  const { t } = useLang();
  const reduce = useReducedMotion();
  const base = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const boost = useTransform(velocity, [0, 1000], [0, 4], { clamp: false });
  const dir = useRef(1);
  const x = useTransform(base, v => `${wrap(-100 / COPIES, 0, v)}%`);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    let move = dir.current * speed * (delta / 1000);
    if (boost.get() < 0) dir.current = -1;
    else if (boost.get() > 0) dir.current = 1;
    move += dir.current * move * boost.get();
    base.set(base.get() - move);
  });

  const words = [...t.about.styles, 'Montréal'];

  return (
    <div className="marquee" aria-hidden="true">
      <motion.div className="marquee-track" style={{ x }}>
        {Array.from({ length: COPIES }, (_, c) => (
          <div className="marquee-group" key={c}>
            {words.map((w, i) => (
              <span className="marquee-item" key={i}>
                <span className={i % 2 ? 'outline' : ''}>{w}</span>
                <Sigil />
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
