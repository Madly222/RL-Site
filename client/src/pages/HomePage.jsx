import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, ChevronLeft, Users, Building } from 'lucide-react';
import { useLang } from '../LangContext.jsx';
import { EditableText, EditableImage } from '../components/Editable.jsx';
import { EditableIcon, getIcon } from '../components/IconPicker.jsx';
import { useAdmin } from '../AdminContext.jsx';
import './HomePage.css';

const defaultServiceIcons = { internet: 'wifi', hosting: 'harddrive', vps: 'server', security: 'shield' };
const defaultFeatureIcons = ['shield', 'zap', 'headphones', 'server'];

const serviceLinks = {
  internet: '/personal#plans',
  hosting: '/business?tab=hosting#plans',
  vps: '/business?tab=vps#plans',
  security: '/business?tab=security#plans'
};

const defaultSpecialServices = [
  { id: 1, image: '', titleKey: 'special.1.title', descKey: 'special.1.desc' },
  { id: 2, image: '', titleKey: 'special.2.title', descKey: 'special.2.desc' },
  { id: 3, image: '', titleKey: 'special.3.title', descKey: 'special.3.desc' },
  { id: 4, image: '', titleKey: 'special.4.title', descKey: 'special.4.desc' },
  { id: 5, image: '', titleKey: 'special.5.title', descKey: 'special.5.desc' },
  { id: 6, image: '', titleKey: 'special.6.title', descKey: 'special.6.desc' },
];

function SpecialServicesSlider() {
  const { t, setTranslation } = useLang();
  const { isAdmin, editMode } = useAdmin();
  const s = (key) => (val) => setTranslation(key, val);
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [images, setImages] = useState({});

  // Load saved images from server
  useEffect(() => {
    fetch('/api/translations/icons')
      .then(r => r.json())
      .then(data => {
        const imgs = {};
        defaultSpecialServices.forEach(svc => {
          const key = `specialImg${svc.id}`;
          if (data[key]) imgs[svc.id] = data[key];
        });
        setImages(imgs);
      })
      .catch(() => {});
  }, []);

  const updateScrollButtons = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [updateScrollButtons]);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.querySelector('.special__card')?.offsetWidth || 340;
    el.scrollBy({ left: dir * (cardWidth + 20), behavior: 'smooth' });
  };

  const saveImage = (id, url) => {
    setImages(prev => ({ ...prev, [id]: url }));
    fetch('/api/translations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: 'icons', key: `specialImg${id}`, value: url })
    }).catch(() => {});
  };

  const placeholderImg = 'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" fill="none">
      <rect width="400" height="240" rx="12" fill="#1c1c28"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#55556a" font-family="Arial" font-size="14">Нет фото</text>
    </svg>`
  );

  return (
    <section className="section special-services">
      <div className="container">
        <EditableText value={t('special.label') || 'СПЕЦПРЕДЛОЖЕНИЯ'} tag="div" className="section-label" onSave={s('special.label')} />
        <div className="special__header">
          <div>
            <EditableText value={t('special.title') || 'Особые услуги'} tag="h2" className="section-title" onSave={s('special.title')} />
            <EditableText value={t('special.subtitle') || 'Уникальные решения для вашего бизнеса и дома'} tag="p" className="section-subtitle" onSave={s('special.subtitle')} />
          </div>
          <div className="special__nav">
            <button
              className={`special__nav-btn${!canScrollLeft ? ' special__nav-btn--disabled' : ''}`}
              onClick={() => scroll(-1)}
              disabled={!canScrollLeft}
              aria-label="Назад"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className={`special__nav-btn${!canScrollRight ? ' special__nav-btn--disabled' : ''}`}
              onClick={() => scroll(1)}
              disabled={!canScrollRight}
              aria-label="Вперёд"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div className="special__track" ref={trackRef}>
          {defaultSpecialServices.map((svc, i) => (
            <div key={svc.id} className="special__card" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="special__img-wrap">
                <EditableImage
                  src={images[svc.id] || placeholderImg}
                  className="special__img"
                  alt={t(svc.titleKey) || `Услуга ${svc.id}`}
                  name={`special-${svc.id}`}
                  onSave={(url) => saveImage(svc.id, url)}
                />
              </div>
              <div className="special__card-body">
                <EditableText
                  value={t(svc.titleKey) || `Услуга ${svc.id}`}
                  tag="h3"
                  className="special__card-title"
                  onSave={s(svc.titleKey)}
                />
                <EditableText
                  value={t(svc.descKey) || 'Описание услуги'}
                  tag="p"
                  className="special__card-desc"
                  onSave={s(svc.descKey)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

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

      {/* === SPECIAL SERVICES SLIDER === */}
      <SpecialServicesSlider />

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