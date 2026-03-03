import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ro } from './locales/ro.js';
import { ru } from './locales/ru.js';

const baseTranslations = { ro: JSON.parse(JSON.stringify(ro)), ru: JSON.parse(JSON.stringify(ru)) };
const LangContext = createContext();

function deepSet(obj, keys, value) {
  const last = keys.pop();
  let ref = obj;
  for (const k of keys) {
    if (!ref[k]) ref[k] = {};
    ref = ref[k];
  }
  ref[last] = value;
}

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

  // Load saved overrides on mount
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
    // Check overrides first
    if (overrides[lang] && overrides[lang][key] !== undefined) {
      return overrides[lang][key];
    }
    // Then base translations
    const val = deepGet(baseTranslations[lang], keys);
    return val !== undefined ? val : key;
  }, [lang, overrides]);

  const setTranslation = useCallback((key, value) => {
    setOverrides(prev => ({
      ...prev,
      [lang]: { ...prev[lang], [key]: value }
    }));
    // Save to server
    fetch('/api/translations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang, key, value })
    }).catch(() => {});
  }, [lang]);

  const toggleLang = () => {
    setLang(prev => prev === 'ro' ? 'ru' : 'ro');
  };

  return (
    <LangContext.Provider value={{ lang, setLang, toggleLang, t, setTranslation }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
