import React, { createContext, useContext, useState, useCallback } from 'react';
import ro from './locales/ro.js';
import ru from './locales/ru.js';

const ContentContext = createContext();

// Deep clone translations as initial editable content
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

export function ContentProvider({ children }) {
  const [overrides, setOverrides] = useState({ ro: {}, ru: {} });

  const setContent = useCallback((lang, key, value) => {
    setOverrides(prev => ({
      ...prev,
      [lang]: { ...prev[lang], [key]: value }
    }));
  }, []);

  const getContent = useCallback((lang, key, fallback) => {
    if (overrides[lang] && overrides[lang][key] !== undefined) {
      return overrides[lang][key];
    }
    return fallback;
  }, [overrides]);

  const saveAllToServer = useCallback(async () => {
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overrides)
      });
      return res.ok;
    } catch {
      return false;
    }
  }, [overrides]);

  return (
    <ContentContext.Provider value={{ overrides, setContent, getContent, saveAllToServer }}>
      {children}
    </ContentContext.Provider>
  );
}

export const useContent = () => useContext(ContentContext);
