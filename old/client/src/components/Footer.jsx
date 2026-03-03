import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useLang } from '../LangContext.jsx';
import { EditableText } from './Editable.jsx';
import './Footer.css';

function Footer() {
  const { t } = useLang();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <img src="/images/logo.png" alt="RapidLink" className="footer__logo-img" />
              <span>Rapid<span style={{ color: 'var(--accent)' }}>Link</span></span>
            </Link>
            <p className="footer__slogan">The best connection ever</p>
            <EditableText value={t('footer.desc')} tag="p" className="footer__desc" />
          </div>
          <div className="footer__col">
            <EditableText value={t('footer.servicesTitle')} tag="h4" className="footer__heading" />
            <Link to="/personal" className="footer__link">{t('serviceData.internet.title')}</Link>
            <Link to="/business" className="footer__link">{t('serviceData.hosting.title')}</Link>
            <Link to="/business" className="footer__link">{t('serviceData.vps.title')}</Link>
            <Link to="/business" className="footer__link">{t('serviceData.security.title')}</Link>
          </div>
          <div className="footer__col">
            <EditableText value={t('footer.contactsTitle')} tag="h4" className="footer__heading" />
            <a href="tel:+37360450088" className="footer__link footer__contact">
              <Phone size={14} /> 0 (60) 45 00 88
            </a>
            <a href="mailto:support@rapidlink.md" className="footer__link footer__contact">
              <Mail size={14} /> support@rapidlink.md
            </a>
            <span className="footer__link footer__contact">
              <MapPin size={14} /> Gheorghe Asachi 71/7
            </span>
          </div>
        </div>
        <div className="footer__bottom">
          <p>&copy; {new Date().getFullYear()} RapidLink. {t('footer.rights')}</p>
          <div className="footer__bottom-links">
            <Link to="/documents/calitatea-serviciilor">{t('footer.quality')}</Link>
            <Link to="/documents/certificate">{t('footer.certificates')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
