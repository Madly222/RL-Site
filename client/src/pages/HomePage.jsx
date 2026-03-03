import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Users, Building } from 'lucide-react';
import { useLang } from '../LangContext.jsx';
import { EditableText } from '../components/Editable.jsx';
import { EditableIcon, getIcon } from '../components/IconPicker.jsx';
import './HomePage.css';

const defaultServiceIcons = { internet: 'wifi', hosting: 'harddrive', vps: 'server', security: 'shield' };
const defaultFeatureIcons = ['shield', 'zap', 'headphones', 'server'];

const serviceLinks = {
  internet: '/personal#plans',
  hosting: '/business?tab=hosting#plans',
  vps: '/business?tab=vps#plans',
  security: '/business?tab=security#plans'
};

function HomePage() {
  const { t, setTranslation } = useLang();
  const s = (key) => (val) => setTranslation(key, val);

  const [svcIcons, setSvcIcons] = useState(defaultServiceIcons);
  const [featIcons, setFeatIcons] = useState(defaultFeatureIcons);

  useEffect(() => {
    fetch('/api/translations/icons').then(r => r.json()).then(data => {
      if (data.svcInternet) setSvcIcons(prev => ({ ...prev, internet: data.svcInternet }));
      if (data.svcHosting) setSvcIcons(prev => ({ ...prev, hosting: data.svcHosting }));
      if (data.svcVps) setSvcIcons(prev => ({ ...prev, vps: data.svcVps }));
      if (data.svcSecurity) setSvcIcons(prev => ({ ...prev, security: data.svcSecurity }));
      if (data.feat0) setFeatIcons(prev => { const n = [...prev]; n[0] = data.feat0; return n; });
      if (data.feat1) setFeatIcons(prev => { const n = [...prev]; n[1] = data.feat1; return n; });
      if (data.feat2) setFeatIcons(prev => { const n = [...prev]; n[2] = data.feat2; return n; });
      if (data.feat3) setFeatIcons(prev => { const n = [...prev]; n[3] = data.feat3; return n; });
    }).catch(() => {});
  }, []);

  const saveIcon = (key, val) => {
    fetch('/api/translations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: 'icons', key, value: val })
    }).catch(() => {});
  };

  const saveSvcIcon = (id, val) => {
    setSvcIcons(prev => ({ ...prev, [id]: val }));
    saveIcon(`svc${id.charAt(0).toUpperCase() + id.slice(1)}`, val);
  };

  const saveFeatIcon = (idx, val) => {
    setFeatIcons(prev => { const n = [...prev]; n[idx] = val; return n; });
    saveIcon(`feat${idx}`, val);
  };

  return (
    <div className="home">
      <section className="hero">
        <div className="hero__bg">
          <div className="hero__grid-lines" />
          <div className="hero__glow" />
          <div className="hero__glow hero__glow--2" />
        </div>
        <div className="container hero__content">
          <div className="hero__text">
            <h1 className="hero__title animate-in animate-delay-1">
              <EditableText value={t('hero.titleBefore1')} tag="span" onSave={s('hero.titleBefore1')} />{' '}
              <span className="hero__accent"><EditableText value={t('hero.title1')} tag="span" onSave={s('hero.title1')} /></span><br/>
              <EditableText value={t('hero.titleBetween')} tag="span" onSave={s('hero.titleBetween')} />{' '}
              <span className="hero__accent"><EditableText value={t('hero.title2')} tag="span" onSave={s('hero.title2')} /></span>
            </h1>
            <EditableText value={t('hero.subtitle')} tag="p" className="hero__subtitle animate-in animate-delay-2" onSave={s('hero.subtitle')} />
            <div className="hero__actions animate-in animate-delay-3">
              <Link to="/personal" className="btn btn-primary">
                {t('hero.btnServices')} <ArrowRight size={18} />
              </Link>
              <Link to="/contact" className="btn btn-outline">{t('hero.btnContact')}</Link>
            </div>
          </div>
          <div className="hero__visual animate-in animate-delay-2">
            <div className="hero__server-rack">
              <div className="hero__server-unit">
                <div className="hero__server-lights"><span className="hero__led hero__led--green" /><span className="hero__led hero__led--green" /><span className="hero__led hero__led--red" /></div>
                <div className="hero__server-slots"><span /><span /><span /><span /></div>
              </div>
              <div className="hero__server-unit">
                <div className="hero__server-lights"><span className="hero__led hero__led--green" /><span className="hero__led hero__led--green" /><span className="hero__led hero__led--green" /></div>
                <div className="hero__server-slots"><span /><span /><span /><span /></div>
              </div>
              <div className="hero__server-unit">
                <div className="hero__server-lights"><span className="hero__led hero__led--green" /><span className="hero__led hero__led--red" /><span className="hero__led hero__led--green" /></div>
                <div className="hero__server-slots"><span /><span /><span /><span /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section services-preview">
        <div className="container">
          <EditableText value={t('services.label')} tag="div" className="section-label" onSave={s('services.label')} />
          <EditableText value={t('services.title')} tag="h2" className="section-title" onSave={s('services.title')} />
          <EditableText value={t('services.subtitle')} tag="p" className="section-subtitle" onSave={s('services.subtitle')} />
          <div className="services-preview__grid">
            {Object.keys(defaultServiceIcons).map((id, i) => (
              <div key={id} className="services-preview__card card animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="services-preview__icon">
                  <EditableIcon iconName={svcIcons[id]} size={24} onSave={(val) => saveSvcIcon(id, val)} />
                </div>
                <EditableText value={t(`serviceData.${id}.title`)} tag="h3" className="services-preview__title" onSave={s(`serviceData.${id}.title`)} />
                <EditableText value={t(`serviceData.${id}.description`)} tag="p" className="services-preview__desc" onSave={s(`serviceData.${id}.description`)} />
                <Link to={serviceLinks[id]} className="services-preview__link">
                  {t('services.more')} <ChevronRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section pricing">
        <div className="container">
          <EditableText value={t('pricing.label')} tag="div" className="section-label" onSave={s('pricing.label')} />
          <EditableText value={t('pricing.title')} tag="h2" className="section-title" onSave={s('pricing.title')} />
          <EditableText value={t('pricing.subtitle')} tag="p" className="section-subtitle" onSave={s('pricing.subtitle')} />
          <div className="pricing__cards">
            <Link to="/personal#plans" className="pricing__card">
              <div className="pricing__card-icon"><Users size={32} /></div>
              <EditableText value={t('pricing.personalBtn')} tag="h3" className="pricing__card-title" onSave={s('pricing.personalBtn')} />
              <EditableText value={t('pricing.personalDesc')} tag="p" className="pricing__card-desc" onSave={s('pricing.personalDesc')} />
              <span className="pricing__card-link">{t('services.more')} <ArrowRight size={16} /></span>
            </Link>
            <Link to="/business#plans" className="pricing__card">
              <div className="pricing__card-icon"><Building size={32} /></div>
              <EditableText value={t('pricing.businessBtn')} tag="h3" className="pricing__card-title" onSave={s('pricing.businessBtn')} />
              <EditableText value={t('pricing.businessDesc')} tag="p" className="pricing__card-desc" onSave={s('pricing.businessDesc')} />
              <span className="pricing__card-link">{t('services.more')} <ArrowRight size={16} /></span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section features">
        <div className="container">
          <EditableText value={t('features.label')} tag="div" className="section-label" onSave={s('features.label')} />
          <EditableText value={t('features.title')} tag="h2" className="section-title" onSave={s('features.title')} />
          <div className="features__grid">
            {featIcons.map((iconName, i) => (
              <div key={i} className="features__item animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="features__icon-wrap">
                  <EditableIcon iconName={iconName} size={28} onSave={(val) => saveFeatIcon(i, val)} />
                </div>
                <EditableText value={t(`featureData.${defaultFeatureIcons[i]}.title`)} tag="h3" className="features__title" onSave={s(`featureData.${defaultFeatureIcons[i]}.title`)} />
                <EditableText value={t(`featureData.${defaultFeatureIcons[i]}.desc`)} tag="p" className="features__desc" onSave={s(`featureData.${defaultFeatureIcons[i]}.desc`)} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section cta">
        <div className="container">
          <div className="cta__box">
            <div className="cta__glow" />
            <EditableText value={t('cta.title')} tag="h2" className="cta__title" onSave={s('cta.title')} />
            <EditableText value={t('cta.desc')} tag="p" className="cta__desc" onSave={s('cta.desc')} />
            <Link to="/contact" className="btn btn-primary">
              {t('cta.btn')} <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
