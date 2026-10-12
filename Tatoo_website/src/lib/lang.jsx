import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DICT } from '../dict.js';
import { PROPS } from '../config.js';

const LangContext = createContext(null);

function initialLang() {
  try {
    const saved = localStorage.getItem('sr_lang');
    if (saved === 'en' || saved === 'fr') return saved;
  } catch (e) { /* storage blocked */ }
  return PROPS.lang === 'fr' ? 'fr' : 'en';
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);

  useEffect(() => {
    const t = DICT[lang];
    document.documentElement.lang = lang === 'fr' ? 'fr-CA' : 'en-CA';
    document.title = t.meta.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', t.meta.desc);
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    t: DICT[lang],
    setLang(next) {
      try { localStorage.setItem('sr_lang', next); } catch (e) { /* storage blocked */ }
      setLangState(next);
    }
  }), [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
