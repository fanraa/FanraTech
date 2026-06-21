'use client';

import { useState, useEffect } from 'react';

export type Language = 'id' | 'en';

export function useLanguage() {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('fanratech_language') as Language;
      if (savedLang === 'id' || savedLang === 'en') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLangState(savedLang);
      } else {
        localStorage.setItem('fanratech_language', 'en');
      }

      const handleLanguageChange = (e: Event) => {
        const customEvent = e as CustomEvent<{ lang: Language }>;
        if (customEvent.detail && (customEvent.detail.lang === 'id' || customEvent.detail.lang === 'en')) {
          setLangState(customEvent.detail.lang);
        }
      };

      window.addEventListener('fanratech_language_changed', handleLanguageChange);
      return () => {
        window.removeEventListener('fanratech_language_changed', handleLanguageChange);
      };
    }
  }, []);

  const setLang = (newLang: Language) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fanratech_language', newLang);
      setLangState(newLang);
      window.dispatchEvent(
        new CustomEvent('fanratech_language_changed', { detail: { lang: newLang } })
      );
    }
  };

  // Quick helper to choose correct translation
  const t = (idText: string, enText: string) => {
    return lang === 'id' ? idText : enText;
  };

  return { lang, setLang, t };
}
