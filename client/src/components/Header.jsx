import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, CreditCard, ChevronDown, Sun, Moon, Info, Plus, Trash2, Edit3, Pencil } from 'lucide-react';
import { useLang } from '../LangContext.jsx';
import { useTheme } from '../ThemeContext.jsx';
import { useAdmin } from '../AdminContext.jsx';
import { EditableText } from '../components/Editable.jsx';
import { authFetch } from '../api.js';
import './Header.css';

const FlagMD = () => (
  <svg width="24" height="16" viewBox="0 0 36 24" style={{borderRadius: 2, display: 'block'}}>
    <rect width="12" height="24" fill="#003DA5"/>
    <rect x="12" width="12" height="24" fill="#FFD200"/>
    <rect x="24" width="12" height="24" fill="#CC0033"/>
  </svg>
);

const FlagRU = () => (
  <svg width="24" height="16" viewBox="0 0 36 24" style={{borderRadius: 2, display: 'block'}}>
    <rect width="36" height="8" fill="#fff"/>
    <rect y="8" width="36" height="8" fill="#0039A6"/>
    <rect y="16" width="36" height="8" fill="#D52B1E"/>
  </svg>
);

const DEFAULT_PAY_METHODS = [
  { id: 'oplata', url: 'https://oplata.md/rapidlink' },
  { id: 'paynet', url: 'https://paynet.md/account/signup' }
];

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payInfo, setPayInfo] = useState(null);
  const payRef = useRef(null);
  const location = useLocation();
  const { lang, toggleLang, t, setTranslation, tLang, setTranslationForLang } = useLang();
  const s = (key) => (val) => setTranslation(key, val);
  const otherLang = lang === 'ro' ? 'ru' : 'ro';
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, editMode } = useAdmin();

  const [headerLinks, setHeaderLinks] = useState([]);
  const [logoLight, setLogoLight] = useState('/images/logo.png');
  const [logoDark, setLogoDark] = useState('/images/logo.png');
  const [payMethods, setPayMethods] = useState([]);
  const [payMethodsLoaded, setPayMethodsLoaded] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setPayOpen(false);
    setPayInfo(null);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (payRef.current && !payRef.current.contains(e.target)) {
        setPayOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Load everything from server
  useEffect(() => {
    fetch('/api/translations/icons').then(r => r.json()).then(data => {
      if (data.headerLinks) {
        try { setHeaderLinks(JSON.parse(data.headerLinks)); } catch { setHeaderLinks([]); }
      }
      if (data.logoLight) setLogoLight(data.logoLight);
      if (data.logoDark) setLogoDark(data.logoDark);
      if (data.payMethods) {
        try {
          const parsed = JSON.parse(data.payMethods);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPayMethods(parsed);
            setPayMethodsLoaded(true);
            return;
          }
        } catch {}
      }
      // No saved payMethods — use defaults and save them to server
      const defaults = DEFAULT_PAY_METHODS.map(d => ({
        ...d,
        nameKey: `nav.pay_${d.id}_name`,
        descKey: `nav.pay_${d.id}_desc`,
        infoTitleKey: `nav.pay_${d.id}_info`,
        stepsKey: `nav.pay_${d.id}_steps`
      }));
      setPayMethods(defaults);
      setPayMethodsLoaded(true);
      // Save defaults to server so they persist
      authFetch('/api/translations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang: 'icons', key: 'payMethods', value: JSON.stringify(defaults) })
      }).catch(() => {});
    }).catch(() => {
      setPayMethodsLoaded(true);
    });
  }, []);

  // Migrate old translation keys to new keys (one-time, only if new keys are empty)
  useEffect(() => {
    if (!payMethodsLoaded || payMethods.length === 0) return;
    payMethods.forEach(method => {
      if (method.id === 'oplata') {
        migrateKey('nav.payOplataName', method.nameKey, 'oplata.md', 'oplata.md');
        migrateKey('nav.payOnline', method.descKey);
        migrateKey('nav.payInfoOplata', method.infoTitleKey);
        migrateArrayKey('nav.payInfoOplataSteps', method.stepsKey);
      }
      if (method.id === 'paynet') {
        migrateKey('nav.payPaynetName', method.nameKey, 'Paynet', 'Paynet');
        migrateKey('nav.paySystem', method.descKey);
        migrateKey('nav.payInfoPaynet', method.infoTitleKey);
        migrateArrayKey('nav.payInfoPaynetSteps', method.stepsKey);
      }
    });
  }, [payMethodsLoaded]);

  const migrateKey = (oldKey, newKey, fallbackRo, fallbackRu) => {
    const newVal = t(newKey);
    // If new key already has a value, don't overwrite
    if (newVal && newVal !== newKey) return;
    // Try old key
    const oldVal = t(oldKey);
    if (oldVal && oldVal !== oldKey) {
      setTranslation(newKey, oldVal);
      const otherOldVal = tLang(otherLang, oldKey);
      if (otherOldVal && otherOldVal !== oldKey) {
        setTranslationForLang(otherLang, newKey, otherOldVal);
      }
    } else if (fallbackRo) {
      // No old key either — set hardcoded fallbacks
      if (lang === 'ro') {
        setTranslation(newKey, fallbackRo);
        setTranslationForLang(otherLang, newKey, fallbackRu || fallbackRo);
      } else {
        setTranslation(newKey, fallbackRu || fallbackRo);
        setTranslationForLang(otherLang, newKey, fallbackRo);
      }
    }
  };

  const migrateArrayKey = (oldKey, newKey) => {
    const newVal = t(newKey);
    if (Array.isArray(newVal) && newVal.length > 0) return;
    const oldVal = t(oldKey);
    if (Array.isArray(oldVal) && oldVal.length > 0) {
      setTranslation(newKey, oldVal);
      const otherOldVal = tLang(otherLang, oldKey);
      if (Array.isArray(otherOldVal) && otherOldVal.length > 0) {
        setTranslationForLang(otherLang, newKey, otherOldVal);
      }
    }
  };

  const savePayMethods = (methods) => {
    setPayMethods(methods);
    authFetch('/api/translations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: 'icons', key: 'payMethods', value: JSON.stringify(methods) })
    }).catch(() => {});
  };

  const addPayMethod = () => {
    const newId = 'pay-' + Date.now();
    const updated = [...payMethods, {
      id: newId,
      nameKey: `nav.pay_${newId}_name`,
      descKey: `nav.pay_${newId}_desc`,
      url: 'https://',
      infoTitleKey: `nav.pay_${newId}_info`,
      stepsKey: `nav.pay_${newId}_steps`
    }];
    const nameCur = lang === 'ro' ? 'Metodă nouă' : 'Новый метод';
    const nameOther = lang === 'ro' ? 'Новый метод' : 'Metodă nouă';
    const descCur = lang === 'ro' ? 'Descriere' : 'Описание';
    const descOther = lang === 'ro' ? 'Описание' : 'Descriere';
    const infoCur = lang === 'ro' ? 'Cum achitați' : 'Как оплатить';
    const infoOther = lang === 'ro' ? 'Как оплатить' : 'Cum achitați';
    const stepCur = lang === 'ro' ? ['Pasul 1', 'Pasul 2'] : ['Шаг 1', 'Шаг 2'];
    const stepOther = lang === 'ro' ? ['Шаг 1', 'Шаг 2'] : ['Pasul 1', 'Pasul 2'];

    setTranslation(`nav.pay_${newId}_name`, nameCur);
    setTranslation(`nav.pay_${newId}_desc`, descCur);
    setTranslation(`nav.pay_${newId}_info`, infoCur);
    setTranslation(`nav.pay_${newId}_steps`, stepCur);
    setTranslationForLang(otherLang, `nav.pay_${newId}_name`, nameOther);
    setTranslationForLang(otherLang, `nav.pay_${newId}_desc`, descOther);
    setTranslationForLang(otherLang, `nav.pay_${newId}_info`, infoOther);
    setTranslationForLang(otherLang, `nav.pay_${newId}_steps`, stepOther);
    savePayMethods(updated);
  };

  const deletePayMethod = (id) => {
    if (!confirm('Удалить этот метод оплаты?')) return;
    savePayMethods(payMethods.filter(m => m.id !== id));
  };

  const updatePayMethodUrl = (id, url) => {
    savePayMethods(payMethods.map(m => m.id === id ? { ...m, url } : m));
  };

  const addStep = (stepsKey) => {
    const current = t(stepsKey);
    const otherCurrent = tLang(otherLang, stepsKey);
    const newStepCur = lang === 'ro' ? 'Pas nou' : 'Новый шаг';
    const newStepOther = lang === 'ro' ? 'Новый шаг' : 'Pas nou';
    const arr = Array.isArray(current) ? [...current, newStepCur] : [newStepCur];
    const otherArr = Array.isArray(otherCurrent) ? [...otherCurrent, newStepOther] : [newStepOther];
    setTranslation(stepsKey, arr);
    setTranslationForLang(otherLang, stepsKey, otherArr);
  };

  const deleteStep = (stepsKey, idx) => {
    const current = t(stepsKey);
    const otherCurrent = tLang(otherLang, stepsKey);
    if (!Array.isArray(current)) return;
    const arr = [...current];
    arr.splice(idx, 1);
    setTranslation(stepsKey, arr);
    if (Array.isArray(otherCurrent)) {
      const otherArr = [...otherCurrent];
      otherArr.splice(idx, 1);
      setTranslationForLang(otherLang, stepsKey, otherArr);
    }
  };

  const editStep = (stepsKey, idx, val) => {
    const current = t(stepsKey);
    if (!Array.isArray(current)) return;
    const arr = [...current];
    arr[idx] = val;
    setTranslation(stepsKey, arr);
  };

  const saveHeaderLinks = (links) => {
    setHeaderLinks(links);
    authFetch('/api/translations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: 'icons', key: 'headerLinks', value: JSON.stringify(links) })
    }).catch(() => {});
  };

  const addHeaderLink = () => {
    saveHeaderLinks([...headerLinks, { id: Date.now(), icon: '', url: '' }]);
  };

  const deleteHeaderLink = (id) => {
    saveHeaderLinks(headerLinks.filter(l => l.id !== id));
  };

  const updateHeaderLink = (id, field, value) => {
    saveHeaderLinks(headerLinks.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const handleIconUpload = (id) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', 'header-link-' + id);
      try {
        const res = await authFetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.url) updateHeaderLink(id, 'icon', data.url);
      } catch {}
    };
    input.click();
  };

  const handleLogoUpload = (variant) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', variant === 'dark' ? 'logo-dark' : 'logo-light');
      try {
        const res = await authFetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.url) {
          const key = variant === 'dark' ? 'logoDark' : 'logoLight';
          if (variant === 'dark') setLogoDark(data.url);
          else setLogoLight(data.url);
          authFetch('/api/translations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lang: 'icons', key, value: data.url })
          }).catch(() => {});
        }
      } catch {}
    };
    input.click();
  };

  const currentLogo = theme === 'dark' ? logoDark : logoLight;

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/personal', label: t('nav.personal') },
    { path: '/business', label: t('nav.business') },
    { path: '/contact', label: t('nav.contact') },
  ];

  // Get translation with fallback — never returns the key itself
  const tSafe = (key) => {
    const val = t(key);
    return (val && val !== key) ? val : null;
  };

  const getPayName = (method) => {
    return tSafe(method.nameKey)
      || (method.id === 'oplata' ? (tSafe('nav.payOplataName') || 'oplata.md') : null)
      || (method.id === 'paynet' ? (tSafe('nav.payPaynetName') || 'Paynet') : null)
      || 'Метод оплаты';
  };

  const getPayDesc = (method) => {
    return tSafe(method.descKey)
      || (method.id === 'oplata' ? (tSafe('nav.payOnline') || 'Plata online') : null)
      || (method.id === 'paynet' ? (tSafe('nav.paySystem') || 'Sistem de plati') : null)
      || 'Описание';
  };

  const getPayInfoTitle = (method) => {
    return tSafe(method.infoTitleKey)
      || (method.id === 'oplata' ? (tSafe('nav.payInfoOplata') || 'Cum achitați') : null)
      || (method.id === 'paynet' ? (tSafe('nav.payInfoPaynet') || 'Cum achitați') : null)
      || 'Как оплатить';
  };

  const getPaySteps = (method) => {
    const val = t(method.stepsKey);
    if (Array.isArray(val) && val.length > 0) return val;
    if (method.id === 'oplata') {
      const old = t('nav.payInfoOplataSteps');
      if (Array.isArray(old) && old.length > 0) return old;
    }
    if (method.id === 'paynet') {
      const old = t('nav.payInfoPaynetSteps');
      if (Array.isArray(old) && old.length > 0) return old;
    }
    return [];
  };

  return (
    <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
      <div className="container header__inner">
        <Link to="/" className="header__logo">
          <img src={currentLogo} alt="RapidLink" className="header__logo-img" />
          {isAdmin && editMode && (
            <div className="header__logo-admin">
              <button className="header__logo-edit-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLogoUpload('light'); }} title="Лого для светлой темы">
                <Sun size={10} />
              </button>
              <button className="header__logo-edit-btn header__logo-edit-btn--dark" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleLogoUpload('dark'); }} title="Лого для тёмной темы">
                <Moon size={10} />
              </button>
            </div>
          )}
        </Link>

        {(headerLinks.length > 0 || (isAdmin && editMode)) && (
          <div className="header__icon-links">
            {headerLinks.map(link => (
              <div key={link.id} className="header__icon-link-wrap">
                {link.icon ? (
                  <a href={link.url || '#'} target="_blank" rel="noopener noreferrer" className="header__icon-link" title={link.url}>
                    <img src={link.icon} alt="" className="header__icon-link-img" />
                  </a>
                ) : (
                  isAdmin && editMode && (
                    <button className="header__icon-link header__icon-link--empty" onClick={() => handleIconUpload(link.id)}>
                      <Plus size={16} />
                    </button>
                  )
                )}
                {isAdmin && editMode && (
                  <div className="header__icon-link-actions">
                    {link.icon && (
                      <button className="header__icon-link-edit" onClick={() => handleIconUpload(link.id)} title="Заменить иконку">
                        <Edit3 size={10} />
                      </button>
                    )}
                    <button className="header__icon-link-delete" onClick={() => deleteHeaderLink(link.id)} title="Удалить">
                      <Trash2 size={10} />
                    </button>
                  </div>
                )}
                {isAdmin && editMode && (
                  <input
                    className="header__icon-link-url"
                    type="text"
                    placeholder="URL..."
                    value={link.url || ''}
                    onChange={(e) => updateHeaderLink(link.id, 'url', e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
            ))}
            {isAdmin && editMode && (
              <button className="header__icon-link header__icon-link--add" onClick={addHeaderLink} title="Добавить иконку">
                <Plus size={18} />
              </button>
            )}
          </div>
        )}

        <nav className={`header__nav ${menuOpen ? 'header__nav--open' : ''}`}>
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`header__link ${location.pathname === link.path ? 'header__link--active' : ''}`}
            >
              {link.label}
            </Link>
          ))}

          <div className="header__pay-wrapper" ref={payRef}>
            <button className="btn btn-primary header__cta" onClick={() => setPayOpen(!payOpen)}>
              <CreditCard size={16} />
              {t('nav.payment')}
              <ChevronDown size={14} className={`header__cta-arrow ${payOpen ? 'header__cta-arrow--open' : ''}`} />
            </button>
            {payOpen && (
              <div className="header__pay-dropdown">
                {payMethods.map(method => {
                  const steps = getPaySteps(method);
                  return (
                    <React.Fragment key={method.id}>
                      <div className="header__pay-item">
                        {isAdmin && editMode ? (
                          <div className="header__pay-link header__pay-link--edit">
                            <EditableText value={getPayName(method)} tag="span" className="header__pay-name" onSave={s(method.nameKey)} />
                            <EditableText value={getPayDesc(method)} tag="span" className="header__pay-desc" onSave={s(method.descKey)} />
                            <input
                              className="header__pay-url-input"
                              type="text"
                              placeholder="URL ссылки..."
                              value={method.url || ''}
                              onChange={(e) => updatePayMethodUrl(method.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        ) : (
                          <a href={method.url || '#'} target="_blank" rel="noopener noreferrer" className="header__pay-link">
                            <span className="header__pay-name">{getPayName(method)}</span>
                            <span className="header__pay-desc">{getPayDesc(method)}</span>
                          </a>
                        )}
                        <button className="header__pay-info-btn" onClick={(e) => { e.stopPropagation(); setPayInfo(payInfo === method.id ? null : method.id); }}>
                          <Info size={14} />
                        </button>
                        {isAdmin && editMode && (
                          <button className="header__pay-delete-btn" onClick={(e) => { e.stopPropagation(); deletePayMethod(method.id); }} title="Удалить">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      {payInfo === method.id && (
                        <div className="header__pay-tooltip">
                          <EditableText value={getPayInfoTitle(method)} tag="strong" onSave={s(method.infoTitleKey)} />
                          <ol>
                            {Array.isArray(steps) && steps.map((step, i) => (
                              <li key={i} className="header__pay-step">
                                {isAdmin && editMode ? (
                                  <>
                                    <EditableText value={step} tag="span" onSave={(val) => editStep(method.stepsKey, i, val)} />
                                    <button className="header__pay-step-delete" onClick={() => deleteStep(method.stepsKey, i)} title="Удалить шаг">
                                      <Trash2 size={10} />
                                    </button>
                                  </>
                                ) : (
                                  step
                                )}
                              </li>
                            ))}
                          </ol>
                          {isAdmin && editMode && (
                            <button className="header__pay-step-add" onClick={() => addStep(method.stepsKey)}>
                              <Plus size={12} /> Добавить шаг
                            </button>
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
                {isAdmin && editMode && (
                  <button className="header__pay-add-method" onClick={addPayMethod}>
                    <Plus size={14} /> Добавить метод оплаты
                  </button>
                )}
              </div>
            )}
          </div>

          <button className="header__theme" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <button className="header__lang" onClick={toggleLang} aria-label="Switch language">
            {lang === 'ro' ? <FlagMD /> : <FlagRU />}
          </button>
        </nav>

        <div className="header__right-mobile">
          <button className="header__theme" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="header__lang" onClick={toggleLang} aria-label="Switch language">
            {lang === 'ro' ? <FlagMD /> : <FlagRU />}
          </button>
          <button className="header__burger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;