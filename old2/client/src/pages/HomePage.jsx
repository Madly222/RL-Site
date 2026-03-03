import React from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, Shield, Headphones, Server, Wifi, HardDrive,
  ArrowRight, ChevronRight, Users, Building
} from 'lucide-react';
import { useLang } from '../LangContext.jsx';
import { EditableText } from '../components/Editable.jsx';
import './HomePage.css';

const iconMap = { shield: Shield, zap: Zap, headphones: Headphones, server: Server };

const services = [
  { id: 'internet', icon: Wifi, link: '/personal#plans' },
  { id: 'hosting', icon: HardDrive, link: '/business?tab=hosting#plans' },
  { id: 'vps', icon: Server, link: '/business?tab=vps#plans' },
  { id: 'security', icon: Shield, link: '/business?tab=security#plans' }
];

const featureIcons = ['shield', 'zap', 'headphones', 'server'];

function HomePage() {
  const { t, setTranslation } = useLang();
  const s = (key) => (val) => setTranslation(key, val);

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
            {services.map((svc, i) => {
              const Icon = svc.icon;
              return (
                <div key={svc.id} className="services-preview__card card animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="services-preview__icon"><Icon size={24} /></div>
                  <EditableText value={t(`serviceData.${svc.id}.title`)} tag="h3" className="services-preview__title" onSave={s(`serviceData.${svc.id}.title`)} />
                  <EditableText value={t(`serviceData.${svc.id}.description`)} tag="p" className="services-preview__desc" onSave={s(`serviceData.${svc.id}.description`)} />
                  <Link to={svc.link} className="services-preview__link">
                    {t('services.more')} <ChevronRight size={16} />
                  </Link>
                </div>
              );
            })}
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
            {featureIcons.map((icon, i) => {
              const Icon = iconMap[icon] || Zap;
              return (
                <div key={i} className="features__item animate-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="features__icon-wrap"><Icon size={28} /></div>
                  <EditableText value={t(`featureData.${icon}.title`)} tag="h3" className="features__title" onSave={s(`featureData.${icon}.title`)} />
                  <EditableText value={t(`featureData.${icon}.desc`)} tag="p" className="features__desc" onSave={s(`featureData.${icon}.desc`)} />
                </div>
              );
            })}
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
