import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Server, Wifi, Shield, HardDrive, Check } from 'lucide-react';
import { api } from '../api.js';
import { useLang } from '../LangContext.jsx';
import { EditableText, EditableImage } from '../components/Editable.jsx';
import PlanCard from '../components/PlanCard.jsx';
import './ServicesPage.css';

const iconForService = { internet: Wifi, hosting: HardDrive, vps: Server, security: Shield };

function ServicesPage({ type = 'personal' }) {
  const { t, setTranslation } = useLang();
  const s = (key) => (val) => setTranslation(key, val);
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const initialTab = searchParams.get('tab') || 'internet';
  const [activeService, setActiveService] = useState(initialTab);

  const serviceKeys = type === 'personal'
    ? ['internet']
    : ['internet', 'hosting', 'vps', 'security'];

  useEffect(() => {
    const tab = searchParams.get('tab') || 'internet';
    setActiveService(tab);
    loadPlans(tab, type);
  }, [type, searchParams]);

  const loadPlans = async (serviceId, planType) => {
    if (serviceId === 'security') { setPlans([]); return; }
    try {
      const data = await api.getPlans(serviceId, planType);
      setPlans(data);
    } catch (err) { setPlans([]); }
  };

  const handleServiceClick = (id) => {
    setActiveService(id);
    loadPlans(id, type);
  };

  const pageTitle = type === 'personal' ? t('services.personalTitle') : t('services.businessTitle');
  const pageSubtitle = type === 'personal' ? t('services.personalSubtitle') : t('services.businessSubtitle');
  const currentFeatures = t(`serviceData.${activeService}.features`);
  const benefits = t(`serviceData.${activeService}.benefits`);
  const functions = t(`serviceData.${activeService}.functions`);
  const benefitsTitle = t(`serviceData.${activeService}.benefitsTitle`);
  const functionsTitle = t(`serviceData.${activeService}.functionsTitle`);
  const securityCta = t(`serviceData.${activeService}.cta`);

  return (
    <div className="services-page">
      <section className="services-page__hero">
        <div className="services-page__glow" />
        <div className="container">
          <div className="section-label">{type === 'personal' ? t('nav.personal') : t('nav.business')}</div>
          <EditableText value={pageTitle} tag="h1" className="section-title" onSave={s(type === "personal" ? "services.personalTitle" : "services.businessTitle")} />
          <EditableText value={pageSubtitle} tag="p" className="section-subtitle" onSave={s(type === "personal" ? "services.personalSubtitle" : "services.businessSubtitle")} />
        </div>
      </section>

      <div className="services-page__banner">
        <EditableImage
          src={type === 'personal' ? '/images/banner-personal.png' : '/images/banner-business.png'}
          className="services-page__banner-img"
        />
      </div>

      <section className="section">
        <div className="container">
          {serviceKeys.length > 1 && (
            <div className="services-page__tabs">
              {serviceKeys.map(id => {
                const Icon = iconForService[id] || Server;
                return (
                  <button
                    key={id}
                    className={`services-page__tab ${activeService === id ? 'services-page__tab--active' : ''}`}
                    onClick={() => handleServiceClick(id)}
                  >
                    <Icon size={20} />
                    <span>{t(`categories.${id}`)}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="services-page__detail animate-in" key={`${type}-${activeService}`}>
            <div className="services-page__detail-info">
              <EditableText value={t(`serviceData.${activeService}.title`)} tag="h2" className="services-page__detail-title" />
              <EditableText value={t(`serviceData.${activeService}.description`)} tag="p" className="services-page__detail-desc" />

              {activeService === 'security' && Array.isArray(benefits) ? (
                <div className="services-page__security-grid">
                  <div className="services-page__security-col">
                    <EditableText value={benefitsTitle} tag="h3" className="services-page__security-heading" />
                    <ul className="services-page__feature-list">
                      {benefits.map((f, i) => (
                        <li key={i} className="services-page__feature-item">
                          <Check size={16} className="services-page__feature-check" />
                          <EditableText value={f} tag="span" />
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="services-page__security-col">
                    <EditableText value={functionsTitle} tag="h3" className="services-page__security-heading" />
                    <ul className="services-page__feature-list">
                      {Array.isArray(functions) && functions.map((f, i) => (
                        <li key={i} className="services-page__feature-item">
                          <Check size={16} className="services-page__feature-check" />
                          <EditableText value={f} tag="span" />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <ul className="services-page__feature-list">
                  {Array.isArray(currentFeatures) && currentFeatures.map((f, i) => (
                    <li key={i} className="services-page__feature-item">
                      <Check size={16} className="services-page__feature-check" />
                      <EditableText value={f} tag="span" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {plans.length > 0 && (
            <div className="services-page__plans" id="plans">
              <EditableText value={t('services.plans')} tag="h3" className="services-page__plans-title" />
              <div className="services-page__plans-grid">
                {plans.map((plan, i) => (
                  <PlanCard key={plan.id} plan={plan} delay={i * 0.1} />
                ))}
              </div>
            </div>
          )}

          {activeService === 'security' && (
            <div className="services-page__custom-cta" id="plans">
              <EditableText value={typeof securityCta === 'string' ? securityCta : ''} tag="p" />
              <a href="/contact" className="btn btn-primary">{t('services.requestQuote')}</a>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default ServicesPage;
