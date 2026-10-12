import { useEffect, useState } from 'react';

export function useMedia(query) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = e => setMatch(e.matches);
    setMatch(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

export const useDesktop = () => useMedia('(min-width: 1080px)');
export const useFinePointer = () => useMedia('(hover: hover) and (pointer: fine)');

export function useActiveSection(ids) {
  const [active, setActive] = useState('');
  useEffect(() => {
    const els = ids.map(id => document.getElementById(id)).filter(Boolean);
    if (!els.length) return undefined;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [ids]);
  return active;
}

export function useInViewId(id, threshold = 0.05) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [id, threshold]);
  return visible;
}

export function useScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [locked]);
}
