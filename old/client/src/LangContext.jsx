import React, { createContext, useContext, useState } from 'react';
import { ro } from './locales/ro.js';
import { ru } from './locales/ru.js';

const translations = { ro, ru };
const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState('ro');

  const t = (key) => {
    const keys = key.split('.');
    let val = translations[lang];
    for (const k of keys) {
      val = val?.[k];
    }
    return val || key;
  };

  const toggleLang = () => {
    setLang(prev => prev === 'ro' ? 'ru' : 'ro');
  };

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
