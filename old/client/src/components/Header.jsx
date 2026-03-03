import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, CreditCard, ChevronDown, Sun, Moon, Info } from 'lucide-react';
import { useLang } from '../LangContext.jsx';
import { useTheme } from '../ThemeContext.jsx';
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
