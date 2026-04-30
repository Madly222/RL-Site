import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authFetch } from './api.js';
import { ro } from './locales/ro.js';
import { ru } from './locales/ru.js';

const baseTranslations = { ro: JSON.parse(JSON.stringify(ro)), ru: JSON.parse(JSON.stringify(ru)) };
const LangContext = createContext();

function deepGet(obj, keys) {
  let val = obj;
  for (const k of keys) {
    val = val?.[k];
  }
  return val;
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState('ro');
  const [overrides, setOverrides] = useState({ ro: {}, ru: {} });

  useEffect(() => {
    Promise.all([
      fetch('/api/translations/ro').then(r => r.json()).catch(() => ({})),
      fetch('/api/translations/ru').then(r => r.json()).catch(() => ({}))
    ]).then(([roOver, ruOver]) => {
      setOverrides({ ro: roOver, ru: ruOver });
    });
  }, []);

  const t = useCallback((key) => {
    const keys = key.split('.');
    if (overrides[lang] && overrides[lang][key] !== undefined) {
      return overrides[lang][key];
    }
    const val = deepGet(baseTranslations[lang], keys);
    return val !== undefined ? val : key;
  }, [lang, overrides]);

  const tLang = useCallback((targetLang, key) => {
    if (overrides[targetLang] && overrides[targetLang][key] !== undefined) {
      return overrides[targetLang][key];
    }
    const keys = key.split('.');
    const val = deepGet(baseTranslations[targetLang], keys);
    return val !== undefined ? val : null;
  }, [overrides]);

  const setTranslation = useCallback((key, value) => {
    setOverrides(prev => ({
      ...prev,
      [lang]: { ...prev[lang], [key]: value }
    }));
    authFetch('/api/translations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang, key, value })
    }).catch(() => {});
  }, [lang]);

  const setTranslationForLang = useCallback((targetLang, key, value) => {
    setOverrides(prev => ({
      ...prev,
      [targetLang]: { ...prev[targetLang], [key]: value }
    }));
    authFetch('/api/translations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: targetLang, key, value })
    }).catch(() => {});
  }, []);

  const toggleLang = () => {
    setLang(prev => prev === 'ro' ? 'ru' : 'ro');
  };

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang, t, tLang, setTranslation, setTranslationForLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}