import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../api.js';
import { useLang } from '../LangContext.jsx';
import { EditableText } from '../components/Editable.jsx';
import './ContactPage.css';

function ContactPage() {
  const [searchParams] = useSearchParams();
  const { t, setTranslation } = useLang();
  const s = (key) => (val) => setTranslation(key, val);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState(null);
  const [responseMsg, setResponseMsg] = useState('');

  useEffect(() => {
    const planName = searchParams.get('plan');
    const price = searchParams.get('price');

    if (planName && price) {
      const msg = t('contact.planMessage')
        .replace('{plan}', planName)
        .replace('{price}', Number(price).toLocaleString());
      setForm(prev => ({ ...prev, message: msg }));
      setTimeout(() => {
        const el = document.getElementById('contact-form');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [searchParams, t]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const data = await api.sendContact(form);
      if (data.success) {
        setStatus('success');
        setResponseMsg(t('contact.success'));
        setForm({ name: '', email: '', phone: '', message: '' });
      } else {
        setStatus('error');
        setResponseMsg(data.error || t('contact.error'));
      }
    } catch (err) {
      setStatus('error');
      setResponseMsg(t('contact.error'));
    }
    setTimeout(() => setStatus(null), 5000);
  };

  const contactInfo = [
    { icon: Phone, label: t('contact.phoneLabel'), value: '0 (60) 45 00 88', href: 'tel:+37360450088' },
    { icon: Mail, label: t('contact.emailLabel'), value: 'support@rapidlink.md', href: 'mailto:support@rapidlink.md' },
    { icon: MapPin, label: t('contact.addressLabel'), value: t('contact.addressValue') },
    { icon: Clock, label: t('contact.hoursLabel'), value: t('contact.hoursValue') },
  ];

  return (
    <div className="contact-page">
      <section className="contact-page__hero">
        <div className="contact-page__glow" />
        <div className="container">
          <EditableText value={t('contact.label')} tag="div" className="section-label" />
          <EditableText value={t('contact.title')} tag="h1" className="section-title" />
          <EditableText value={t('contact.subtitle')} tag="p" className="section-subtitle" />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="contact-page__grid">
            <div className="contact-page__form-wrap" id="contact-form">
              <EditableText value={t('contact.formTitle')} tag="h2" className="contact-page__form-title" />
              <form className="contact-page__form" onSubmit={handleSubmit}>
                <div className="contact-page__field">
                  <label htmlFor="name">{t('contact.name')}</label>
                  <input id="name" name="name" type="text" placeholder={t('contact.namePlaceholder')} value={form.name} onChange={handleChange} required />
                </div>
                <div className="contact-page__field">
                  <label htmlFor="email">{t('contact.email')}</label>
                  <input id="email" name="email" type="email" placeholder={t('contact.emailPlaceholder')} value={form.email} onChange={handleChange} required />
                </div>
                <div className="contact-page__field">
                  <label htmlFor="phone">
                    {t('contact.phone')} <span className="contact-page__optional">{t('contact.phoneOptional')}</span>
                  </label>
                  <input id="phone" name="phone" type="tel" placeholder={t('contact.phonePlaceholder')} value={form.phone} onChange={handleChange} />
                </div>
                <div className="contact-page__field">
                  <label htmlFor="message">{t('contact.message')}</label>
                  <textarea id="message" name="message" placeholder={t('contact.messagePlaceholder')} rows={6} value={form.message} onChange={handleChange} required />
                </div>
                <button type="submit" className="btn btn-primary contact-page__submit" disabled={status === 'loading'}>
                  {status === 'loading' ? t('contact.sending') : <>{t('contact.send')} <Send size={16} /></>}
                </button>
                {status === 'success' && (
                  <div className="contact-page__alert contact-page__alert--success">
                    <CheckCircle size={18} />{responseMsg}
                  </div>
                )}
                {status === 'error' && (
                  <div className="contact-page__alert contact-page__alert--error">
                    <AlertCircle size={18} />{responseMsg}
                  </div>
                )}
              </form>
            </div>

            <div className="contact-page__info">
              <EditableText value={t('contact.infoTitle')} tag="h2" className="contact-page__info-title" />
              <div className="contact-page__info-list">
                {contactInfo.map((item, i) => {
                  const Icon = item.icon;
                  const content = (
                    <div key={i} className="contact-page__info-item">
                      <div className="contact-page__info-icon"><Icon size={20} /></div>
                      <div>
                        <span className="contact-page__info-label">{item.label}</span>
                        <EditableText value={item.value} tag="span" className="contact-page__info-value" />
                      </div>
                    </div>
                  );
                  return item.href ? (
                    <a key={i} href={item.href} style={{ textDecoration: 'none', color: 'inherit' }}>{content}</a>
                  ) : content;
                })}
              </div>
              <div className="contact-page__map">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d404.52994554323186!2d28.822181469868184!3d46.99425247538087!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40c97e943f06c4bd%3A0xcd2db996570b84fc!2sS.C.%20Rapid%20Link!5e0!3m2!1sru!2sus!4v1771601468203!5m2!1sru!2sus"
                  width="100%"
                  height="280"
                  style={{ border: 0, borderRadius: 'var(--radius)' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="RapidLink Office"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ContactPage;
