"use client";
import { createContext, useContext, useState, useEffect } from "react";

type Lang = 'ko' | 'en';

const LanguageContext = createContext<{
  lang: Lang;
  setLang: (lang: Lang) => void;
}>({ lang: 'ko', setLang: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('ko');

  // 초기 언어 설정
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Lang;
    if (savedLanguage && (savedLanguage === 'ko' || savedLanguage === 'en')) {
      setLang(savedLanguage);
    }
  }, []);

  const handleSetLang = (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
} 