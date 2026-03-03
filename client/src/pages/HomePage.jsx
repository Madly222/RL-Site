import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, ChevronLeft, Users, Building, Plus, Trash2, Settings, X } from 'lucide-react';
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

const PLACEHOLDER_IMG = 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="360" fill="none">
    <rect width="320" height="360" fill="#1c1c28"/>
    <rect x="130" y="140" width="60" height="60" rx="8" fill="#2a2a3a"/>
    <path d="M148 178l8-10 6 7 4-3 10 12h-34z" fill="#55556a"/>
    <circle cx="156" cy="160" r="5" fill="#55556a"/>
    <text x="50%" y="230" text-anchor="middle" fill="#55556a" font-family="Arial" font-size="12">Загрузить фото</text>
  </svg>`
);

function HeroSlider() {
  const { t, setTranslation } = useLang();
  const { isAdmin, editMode } = useAdmin();
  const s = (key) => (val) => setTranslation(key, val);

  const [activeIdx, setActiveIdx] = useState(0);
  const [cards, setCards] = useState([]);
  const [images, setImages] = useState({});
  const [speed, setSpeed] = useState(4000);
  const [showSettings, setShowSettings] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    fetch('/api/translations/icons')
      .then(r => r.json())
      .then(data => {
        if (data.sliderSpeed) setSpeed(Number(data.sliderSpeed) || 4000);
        let cardList = [];
        if (data.sliderCards) {
          try { cardList = JSON.parse(data.sliderCards); } catch { cardList = []; }
        }
        if (!cardList.length) {
          cardList = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }];
        }
        setCards(cardList);
        const imgs = {};
        cardList.forEach(c => {
          if (data[`specialImg${c.id}`]) imgs[c.id] = data[`specialImg${c.id}`];
        });
        setImages(imgs);
      })
      .catch(() => {
        setCards([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }]);
      });
  }, []);

  const saveToServer = (key, value) => {
    fetch('/api/translations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: 'icons', key, value })
    }).catch(() => {});
  };

  // Autoplay — single image fade transition
  useEffect(() => {
    if (isPaused || cards.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % cards.length);
    }, speed);
    return () => clearInterval(timerRef.current);
  }, [speed, isPaused, cards.length]);

  const goTo = (idx) => {
    setActiveIdx(idx);
    // Reset timer on manual navigation
    clearInterval(timerRef.current);
    if (!isPaused && cards.length > 1) {
      timerRef.current = setInterval(() => {
        setActiveIdx(prev => (prev + 1) % cards.length);
      }, speed);
    }
  };

  const prev = () => goTo((activeIdx - 1 + cards.length) % cards.length);
  const next = () => goTo((activeIdx + 1) % cards.length);

  const saveImage = (id, url) => {
    setImages(prev => ({ ...prev, [id]: url }));
    saveToServer(`specialImg${id}`, url);
  };

  const addCard = () => {
    const maxId = cards.reduce((max, c) => Math.max(max, c.id), 0);
    const updated = [...cards, { id: maxId + 1 }];
    setCards(updated);
    saveToServer('sliderCards', JSON.stringify(updated));
    setActiveIdx(updated.length - 1);
  };

  const deleteCard = (id) => {
    if (cards.length <= 1) return;
    const idx = cards.findIndex(c => c.id === id);
    const updated = cards.filter(c => c.id !== id);
    setCards(updated);
    saveToServer('sliderCards', JSON.stringify(updated));
    setImages(prev => { const n = { ...prev }; delete n[id]; return n; });
    if (activeIdx >= updated.length) setActiveIdx(updated.length - 1);
    else if (idx < activeIdx) setActiveIdx(activeIdx - 1);
  };

  const handleSpeedChange = (val) => {
    const ms = Math.max(1000, Math.min(15000, Number(val)));
    setSpeed(ms);
    saveToServer('sliderSpeed', String(ms));
  };

  const activeCard = cards[activeIdx];

  return (
    <div
      className="hero-window"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Gradient border like server rack had */}
      <div className="hero-window__border" />

      {/* Admin gear */}
      {isAdmin && editMode && (
        <button className="hero-window__gear" onClick={() => setShowSettings(!showSettings)}>
          {showSettings ? <X size={14} /> : <Settings size={14} />}
        </button>
      )}

      {/* Admin settings */}
      {isAdmin && editMode && showSettings && (
        <div className="hero-window__settings">
          <div className="hero-window__settings-row">
            <label>Скорость:</label>
            <input
              type="range" min="1" max="15" step="0.5"
              value={speed / 1000}
              onChange={(e) => handleSpeedChange(e.target.value * 1000)}
            />
            <span className="hero-window__speed-val">{(speed / 1000).toFixed(1)}с</span>
          </div>
          <div className="hero-window__settings-row">
            <label>Слайдов: {cards.length}</label>
            <button className="hero-window__add-btn" onClick={addCard}>
              <Plus size={14} /> Добавить
            </button>
          </div>
        </div>
      )}

      {/* Image area */}
      <div className="hero-window__image-area">
        {activeCard && (
          <>
            {isAdmin && editMode && (
              <button
                className="hero-window__delete"
                onClick={() => deleteCard(activeCard.id)}
                title="Удалить слайд"
              >
                <Trash2 size={14} />
              </button>
            )}
            <EditableImage
              src={images[activeCard.id] || PLACEHOLDER_IMG}
              className="hero-window__img"
              alt={t(`special.${activeCard.id}.title`) || `Услуга ${activeCard.id}`}
              name={`special-${activeCard.id}`}
              onSave={(url) => saveImage(activeCard.id, url)}
            />
          </>
        )}
      </div>

      {/* Caption */}
      {activeCard && (
        <div className="hero-window__caption">
          <EditableText
            value={t(`special.${activeCard.id}.title`) || `Услуга ${activeCard.id}`}
            tag="div"
            className="hero-window__caption-title"
            onSave={s(`special.${activeCard.id}.title`)}
          />
          <EditableText
            value={t(`special.${activeCard.id}.desc`) || 'Описание услуги'}
            tag="div"
            className="hero-window__caption-desc"
            onSave={s(`special.${activeCard.id}.desc`)}
          />
        </div>
      )}

      {/* Controls */}
      {cards.length > 1 && (
        <div className="hero-window__controls">
          <button className="hero-window__arrow" onClick={prev} aria-label="Назад">
            <ChevronLeft size={16} />
          </button>
          <div className="hero-window__dots">
            {cards.map((c, i) => (
              <button
                key={c.id}
                className={`hero-window__dot${i === activeIdx ? ' hero-window__dot--active' : ''}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
          <button className="hero-window__arrow" onClick={next} aria-label="Вперёд">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
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
            <HeroSlider />
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