import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, CreditCard, ChevronDown, Sun, Moon, Info, Plus, Trash2, Edit3 } from 'lucide-react';
import { useLang } from '../LangContext.jsx';
import { useTheme } from '../ThemeContext.jsx';
import { useAdmin } from '../AdminContext.jsx';
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

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payInfo, setPayInfo] = useState(null);
  const payRef = useRef(null);
  const location = useLocation();
  const { lang, toggleLang, t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, editMode } = useAdmin();

  const [headerLinks, setHeaderLinks] = useState([]);

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

  // Load header icon links
  useEffect(() => {
    fetch('/api/translations/icons').then(r => r.json()).then(data => {
      if (data.headerLinks) {
        try { setHeaderLinks(JSON.parse(data.headerLinks)); } catch { setHeaderLinks([]); }
      }
    }).catch(() => {});
  }, []);

  const saveHeaderLinks = (links) => {
    setHeaderLinks(links);
    fetch('/api/translations', {
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
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.url) updateHeaderLink(id, 'icon', data.url);
      } catch {}
    };
    input.click();
  };

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/personal', label: t('nav.personal') },
    { path: '/business', label: t('nav.business') },
    { path: '/contact', label: t('nav.contact') },
  ];

  return (
    <header className={`header ${scrolled ? 'header--scrolled' : ''}`}>
      <div className="container header__inner">
        <Link to="/" className="header__logo">
          <img src="/images/logo.png" alt="RapidLink" className="header__logo-img" />
          <span className="header__logo-text">
            Rapid<span className="header__logo-accent">Link</span>
          </span>
        </Link>

        {/* Icon links between logo and nav */}
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
                <div className="header__pay-item">
                  <a href="https://oplata.md/rapidlink" target="_blank" rel="noopener noreferrer" className="header__pay-link">
                    <span className="header__pay-name">oplata.md</span>
                    <span className="header__pay-desc">{t('nav.payOnline')}</span>
                  </a>
                  <button className="header__pay-info-btn" onClick={(e) => { e.stopPropagation(); setPayInfo(payInfo === 'oplata' ? null : 'oplata'); }}>
                    <Info size={14} />
                  </button>
                </div>
                {payInfo === 'oplata' && (
                  <div className="header__pay-tooltip">
                    <strong>{t('nav.payInfoOplata')}</strong>
                    <ol>
                      {(t('nav.payInfoOplataSteps') || []).map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
                <div className="header__pay-item">
                  <a href="https://paynet.md/account/signup" target="_blank" rel="noopener noreferrer" className="header__pay-link">
                    <span className="header__pay-name">Paynet</span>
                    <span className="header__pay-desc">{t('nav.paySystem')}</span>
                  </a>
                  <button className="header__pay-info-btn" onClick={(e) => { e.stopPropagation(); setPayInfo(payInfo === 'paynet' ? null : 'paynet'); }}>
                    <Info size={14} />
                  </button>
                </div>
                {payInfo === 'paynet' && (
                  <div className="header__pay-tooltip">
                    <strong>{t('nav.payInfoPaynet')}</strong>
                    <ol>
                      {(t('nav.payInfoPaynetSteps') || []).map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
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