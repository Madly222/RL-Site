import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Server, Wifi, Shield, HardDrive, Check, Plus, Trash2 } from 'lucide-react';
import { api } from '../api.js';
import { useLang } from '../LangContext.jsx';
import { useAdmin } from '../AdminContext.jsx';
import { EditableText, EditableImage } from '../components/Editable.jsx';
import { EditableIcon, getIcon } from '../components/IconPicker.jsx';
import EditableBackground from '../components/EditableBackground.jsx';
import PlanCard from '../components/PlanCard.jsx';
import { authFetch } from '../api.js';
import './ServicesPage.css';

function BannerImage({ type }) {
  const { isAdmin, editMode } = useAdmin();
  const defaultSrc = type === 'personal' ? '/images/banner-personal.png' : '/images/banner-business.png';
  const [src, setSrc] = useState(defaultSrc);
  const [hasError, setHasError] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setChecked(false);
    setHasError(false);
    fetch('/api/translations/icons').then(r => r.json()).then(data => {
      const key = type === 'personal' ? 'bannerPersonal' : 'bannerBusiness';
      const savedUrl = data[key];
      const urlToCheck = savedUrl || defaultSrc;
      const img = new Image();
      img.onload = () => { setSrc(urlToCheck); setChecked(true); setHasError(false); };
      img.onerror = () => { setChecked(true); setHasError(true); };
      img.src = urlToCheck;
    }).catch(() => { setChecked(true); setHasError(true); });
  }, [type]);

  const saveBannerUrl = (url) => {
    const key = type === 'personal' ? 'bannerPersonal' : 'bannerBusiness';
    authFetch('/api/translations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: 'icons', key, value: url })
    }).catch(() => {});
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', type === 'personal' ? 'banner-personal' : 'banner-business');
      try {
        const res = await authFetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.url) { setSrc(data.url); setHasError(false); saveBannerUrl(data.url); }
      } catch {}
    };
    input.click();
  };

  if (!checked) return null;
  if (hasError) {
    if (isAdmin && editMode) {
      return (
        <div className="services-page__banner-placeholder" onClick={handleUpload}>
          <Plus size={32} /><span>Загрузить баннер</span>
        </div>
      );
    }
    return null;
  }

  return (
    <EditableImage
      src={src} className="services-page__banner-img"
      name={type === 'personal' ? 'banner-personal' : 'banner-business'}
      onSave={(url) => { if (url) { setSrc(url); setHasError(false); saveBannerUrl(url); } }}
    />
  );
}

function ServicesPage({ type = 'personal' }) {
  const { t, lang, setTranslation, tLang, setTranslationForLang } = useLang();
  const { isAdmin, editMode } = useAdmin();
  const s = (key) => (val) => setTranslation(key, val);
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [activeService, setActiveService] = useState(searchParams.get('tab') || 'internet');
  const [tabs, setTabs] = useState([]);
  const otherLang = lang === 'ro' ? 'ru' : 'ro';

  useEffect(() => {
    fetch(`/api/service-tabs/${type}`).then(r => r.json()).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setTabs(data);
        const tab = searchParams.get('tab') || data[0].id;
        setActiveService(tab);
        loadPlans(tab, type);
      }
    }).catch(() => {
      const fallback = type === 'personal'
        ? [{ id: 'internet', icon: 'wifi' }]
        : [{ id: 'internet', icon: 'wifi' }, { id: 'hosting', icon: 'harddrive' }, { id: 'vps', icon: 'server' }, { id: 'security', icon: 'shield' }];
      setTabs(fallback);
    });
  }, [type]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tabs.some(t => t.id === tab)) {
      setActiveService(tab);
      loadPlans(tab, type);
    }
  }, [searchParams, tabs]);

  const saveTabs = (newTabs) => {
    setTabs(newTabs);
    authFetch(`/api/service-tabs/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tabs: newTabs })
    }).catch(() => {});
  };

  const loadPlans = async (serviceId, planType) => {
    if (serviceId === 'security') { setPlans([]); return; }
    try { const data = await api.getPlans(serviceId, planType); setPlans(data); }
    catch { setPlans([]); }
  };

  const handleServiceClick = (id) => { setActiveService(id); loadPlans(id, type); };

  const handleAddTab = () => {
    const newId = 'service-' + Date.now();
    const newTabs = [...tabs, { id: newId, icon: 'globe' }];
    saveTabs(newTabs);
    setTranslation(`categories.${newId}`, 'Новая услуга');
    setTranslationForLang(otherLang, `categories.${newId}`, 'Новая услуга');
    setTranslation(`serviceData.${newId}.title`, 'Новая услуга');
    setTranslationForLang(otherLang, `serviceData.${newId}.title`, 'Новая услуга');
    setTranslation(`serviceData.${newId}.description`, 'Описание новой услуги');
    setTranslationForLang(otherLang, `serviceData.${newId}.description`, 'Описание новой услуги');
    setTranslation(`serviceData.${newId}.features`, ['Пункт 1', 'Пункт 2']);
    setTranslationForLang(otherLang, `serviceData.${newId}.features`, ['Пункт 1', 'Пункт 2']);
    setActiveService(newId);
  };

  const handleDeleteTab = (id) => {
    if (!confirm('Удалить эту услугу?')) return;
    const newTabs = tabs.filter(t => t.id !== id);
    saveTabs(newTabs);
    if (activeService === id && newTabs.length > 0) { setActiveService(newTabs[0].id); loadPlans(newTabs[0].id, type); }
  };

  const handleTabIconChange = (tabId, iconName) => {
    saveTabs(tabs.map(t => t.id === tabId ? { ...t, icon: iconName } : t));
  };

  const handleUpdatePlan = async (planId, field, value) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    let update = {};
    if (field === 'name') update.name = value;
    else if (field === 'price') update.price = value;
    else if (field === 'image') update.image = value;
    else if (field === 'bgImage') update.bgImage = value;
    else if (field.startsWith('feature-') && !field.startsWith('feature-toggle') && !field.startsWith('feature-delete')) {
      const idx = parseInt(field.split('-')[1]);
      const newFeatures = [...plan.features]; newFeatures[idx] = { ...newFeatures[idx], text: value }; update.features = newFeatures;
    } else if (field.startsWith('toggleFeature-')) {
      const idx = parseInt(field.split('-')[1]);
      const newFeatures = [...plan.features]; newFeatures[idx] = { ...newFeatures[idx], included: value }; update.features = newFeatures;
    } else if (field.startsWith('deleteFeature-')) {
      const idx = parseInt(field.split('-')[1]);
      update.features = plan.features.filter((_, i) => i !== idx);
    } else if (field === 'addFeature') {
      update.features = [...plan.features, { text: 'Новый пункт', included: true }];
    }
    try { await api.updatePlan(planId, update); loadPlans(activeService, type); }
    catch (err) { console.error('Failed to update plan:', err); }
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm('Удалить этот план?')) return;
    try { await api.deletePlan(planId); loadPlans(activeService, type); }
    catch (err) { console.error('Failed to delete plan:', err); }
  };

  const handleAddPlan = async () => {
    const planName = 'Новый план';
    const planKey = planName.toLowerCase();
    const features = ['Функция 1', 'Функция 2', 'Функция 3'];
    try {
      await api.addPlan({ name: planName, price: 100, category: activeService, type, features: [{ text: 'Функция 1', included: true }, { text: 'Функция 2', included: true }, { text: 'Функция 3', included: false }] });
      authFetch('/api/translations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang: 'ro', key: `planFeatures.${activeService}.${planKey}`, value: features }) });
      authFetch('/api/translations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang: 'ru', key: `planFeatures.${activeService}.${planKey}`, value: features }) });
      loadPlans(activeService, type);
    } catch (err) { console.error('Failed to add plan:', err); }
  };

  const handleFeatureListEdit = (tKey, items, i, val) => { const newArr = [...items]; newArr[i] = val; setTranslation(tKey, newArr); };
  const handleFeatureListDelete = (tKey, items, i) => { const newArr = [...items]; newArr.splice(i, 1); setTranslation(tKey, newArr); const otherArr = tLang(otherLang, tKey); if (Array.isArray(otherArr)) { const copy = [...otherArr]; copy.splice(i, 1); setTranslationForLang(otherLang, tKey, copy); } };
  const handleFeatureListAdd = (tKey, items) => { const newText = lang === 'ro' ? 'Punct nou' : 'Новый пункт'; const otherText = lang === 'ro' ? 'Новый пункт' : 'Punct nou'; const newArr = Array.isArray(items) ? [...items, newText] : [newText]; setTranslation(tKey, newArr); const otherArr = tLang(otherLang, tKey); const otherCopy = Array.isArray(otherArr) ? [...otherArr, otherText] : [otherText]; setTranslationForLang(otherLang, tKey, otherCopy); };

  const contentBlocksRaw = t(`serviceData.${activeService}.contentBlocks`);
  const contentBlocks = Array.isArray(contentBlocksRaw) ? contentBlocksRaw : [];

  const handleAddContentBlock = (blockType) => { const tKey = `serviceData.${activeService}.contentBlocks`; let newBlock, otherBlock; if (blockType === 'image') { newBlock = { type: 'image', src: '' }; otherBlock = { type: 'image', src: '' }; } else if (blockType === 'section') { const title = lang === 'ro' ? 'Titlu nou' : 'Новый заголовок'; const desc = lang === 'ro' ? 'Descriere nouă' : 'Новое описание'; const features = lang === 'ro' ? ['Punct 1', 'Punct 2'] : ['Пункт 1', 'Пункт 2']; const otherTitle = lang === 'ro' ? 'Новый заголовок' : 'Titlu nou'; const otherDesc = lang === 'ro' ? 'Новое описание' : 'Descriere nouă'; const otherFeatures = lang === 'ro' ? ['Пункт 1', 'Пункт 2'] : ['Punct 1', 'Punct 2']; newBlock = { type: 'section', title, description: desc, features }; otherBlock = { type: 'section', title: otherTitle, description: otherDesc, features: otherFeatures }; } else { const text = lang === 'ro' ? 'Text nou' : 'Новый текст'; const otherText = lang === 'ro' ? 'Новый текст' : 'Text nou'; newBlock = { type: 'text', text }; otherBlock = { type: 'text', text: otherText }; } const newArr = [...contentBlocks, newBlock]; setTranslation(tKey, newArr); const otherBlocks = tLang(otherLang, tKey); const otherArr = Array.isArray(otherBlocks) ? [...otherBlocks, otherBlock] : [otherBlock]; setTranslationForLang(otherLang, tKey, otherArr); };
  const handleDeleteContentBlock = (i) => { const tKey = `serviceData.${activeService}.contentBlocks`; const newArr = [...contentBlocks]; newArr.splice(i, 1); setTranslation(tKey, newArr); const otherBlocks = tLang(otherLang, tKey); if (Array.isArray(otherBlocks)) { const copy = [...otherBlocks]; copy.splice(i, 1); setTranslationForLang(otherLang, tKey, copy); } };
  const handleEditContentBlock = (i, field, val) => { const tKey = `serviceData.${activeService}.contentBlocks`; const newArr = [...contentBlocks]; newArr[i] = { ...newArr[i], [field]: val }; setTranslation(tKey, newArr); };
  const handleContentBlockFeatureEdit = (blockIdx, featIdx, val) => { const tKey = `serviceData.${activeService}.contentBlocks`; const newArr = [...contentBlocks]; const features = [...(newArr[blockIdx].features || [])]; features[featIdx] = val; newArr[blockIdx] = { ...newArr[blockIdx], features }; setTranslation(tKey, newArr); };
  const handleContentBlockFeatureDelete = (blockIdx, featIdx) => { const tKey = `serviceData.${activeService}.contentBlocks`; const newArr = [...contentBlocks]; const features = [...(newArr[blockIdx].features || [])]; features.splice(featIdx, 1); newArr[blockIdx] = { ...newArr[blockIdx], features }; setTranslation(tKey, newArr); const otherBlocks = tLang(otherLang, tKey); if (Array.isArray(otherBlocks) && otherBlocks[blockIdx]) { const copy = [...otherBlocks]; const oFeats = [...(copy[blockIdx].features || [])]; oFeats.splice(featIdx, 1); copy[blockIdx] = { ...copy[blockIdx], features: oFeats }; setTranslationForLang(otherLang, tKey, copy); } };
  const handleContentBlockFeatureAdd = (blockIdx) => { const tKey = `serviceData.${activeService}.contentBlocks`; const newArr = [...contentBlocks]; const features = [...(newArr[blockIdx].features || [])]; features.push(lang === 'ro' ? 'Punct nou' : 'Новый пункт'); newArr[blockIdx] = { ...newArr[blockIdx], features }; setTranslation(tKey, newArr); const otherBlocks = tLang(otherLang, tKey); if (Array.isArray(otherBlocks) && otherBlocks[blockIdx]) { const copy = [...otherBlocks]; const oFeats = [...(copy[blockIdx].features || [])]; oFeats.push(lang === 'ro' ? 'Новый пункт' : 'Punct nou'); copy[blockIdx] = { ...copy[blockIdx], features: oFeats }; setTranslationForLang(otherLang, tKey, copy); } };
  const handleContentImageUpload = async (i, file) => { const formData = new FormData(); formData.append('image', file); formData.append('name', `content-${activeService}-${i}-${Date.now()}`); try { const res = await authFetch('/api/upload', { method: 'POST', body: formData }); const data = await res.json(); if (data.url) { const tKey = `serviceData.${activeService}.contentBlocks`; const newArr = [...contentBlocks]; newArr[i] = { ...newArr[i], src: data.url }; setTranslation(tKey, newArr); const otherBlocks = tLang(otherLang, tKey); if (Array.isArray(otherBlocks) && otherBlocks[i]) { const copy = [...otherBlocks]; copy[i] = { ...copy[i], src: data.url }; setTranslationForLang(otherLang, tKey, copy); } } } catch {} };

  const pageTitle = type === 'personal' ? t('services.personalTitle') : t('services.businessTitle');
  const pageSubtitle = type === 'personal' ? t('services.personalSubtitle') : t('services.businessSubtitle');
  const currentFeatures = t(`serviceData.${activeService}.features`);
  const benefits = t(`serviceData.${activeService}.benefits`);
  const functions = t(`serviceData.${activeService}.functions`);
  const benefitsTitle = t(`serviceData.${activeService}.benefitsTitle`);
  const functionsTitle = t(`serviceData.${activeService}.functionsTitle`);
  const securityCta = t(`serviceData.${activeService}.cta`);
  const featuresKey = `serviceData.${activeService}.features`;
  const benefitsKey = `serviceData.${activeService}.benefits`;
  const functionsKey = `serviceData.${activeService}.functions`;

  return (
    <div className="services-page">
      <EditableBackground storageKey={`services.hero.${type}`} tag="section" className="services-page__hero">
        <div className="services-page__glow" />
        <div className="container">
          <div className="section-label">{type === 'personal' ? t('nav.personal') : t('nav.business')}</div>
          <EditableText value={pageTitle} tag="h1" className="section-title" onSave={s(type === 'personal' ? 'services.personalTitle' : 'services.businessTitle')} />
          <EditableText value={pageSubtitle} tag="p" className="section-subtitle" onSave={s(type === 'personal' ? 'services.personalSubtitle' : 'services.businessSubtitle')} />
        </div>
      </EditableBackground>

      <div className="services-page__banner">
        <BannerImage type={type} />
      </div>

      <section className="section">
        <div className="container">
          {tabs.length > 1 && (
            <div className="services-page__tabs">
              {tabs.map(tab => {
                const Icon = getIcon(tab.icon);
                return (
                  <div key={tab.id} className={`services-page__tab-wrap ${activeService === tab.id ? 'services-page__tab-wrap--active' : ''}`}>
                    <EditableBackground storageKey={`svc-tab.${type}.${tab.id}`} className={`services-page__tab ${activeService === tab.id ? 'services-page__tab--active' : ''}`} onClick={() => handleServiceClick(tab.id)}>
                      {isAdmin && editMode ? (<EditableIcon iconName={tab.icon} size={20} onSave={(val) => handleTabIconChange(tab.id, val)} />) : (<Icon size={20} />)}
                      <EditableText value={t(`categories.${tab.id}`)} tag="span" onSave={s(`categories.${tab.id}`)} />
                    </EditableBackground>
                    {isAdmin && editMode && tabs.length > 1 && (
                      <button className="services-page__tab-delete" onClick={() => handleDeleteTab(tab.id)} title="Удалить услугу"><Trash2 size={12} /></button>
                    )}
                  </div>
                );
              })}
              {isAdmin && editMode && (<button className="services-page__tab services-page__tab--add" onClick={handleAddTab}><Plus size={20} /><span>Добавить</span></button>)}
            </div>
          )}

          {tabs.length <= 1 && isAdmin && editMode && (
            <div className="services-page__tabs">
              {tabs.map(tab => {
                const Icon = getIcon(tab.icon);
                return (
                  <EditableBackground key={tab.id} storageKey={`svc-tab.${type}.${tab.id}`} className="services-page__tab services-page__tab--active">
                    {isAdmin && editMode ? (<EditableIcon iconName={tab.icon} size={20} onSave={(val) => handleTabIconChange(tab.id, val)} />) : (<Icon size={20} />)}
                    <EditableText value={t(`categories.${tab.id}`)} tag="span" onSave={s(`categories.${tab.id}`)} />
                  </EditableBackground>
                );
              })}
              <button className="services-page__tab services-page__tab--add" onClick={handleAddTab}><Plus size={20} /><span>Добавить</span></button>
            </div>
          )}

          {/* ====== PLANS ====== */}
          {activeService !== 'security' && (plans.length > 0 || (isAdmin && editMode)) && (
            <div className="services-page__plans" id="plans">
              <EditableText value={t('services.plans')} tag="h3" className="services-page__plans-title" onSave={s('services.plans')} />
              <div className="services-page__plans-grid">
                {plans.map((plan, i) => (
                  <PlanCard key={plan.id} plan={plan} delay={i * 0.1} onDelete={handleDeletePlan} onUpdate={handleUpdatePlan} />
                ))}
                {isAdmin && editMode && (<button className="services-page__add-plan" onClick={handleAddPlan}><Plus size={32} /><span>Добавить план</span></button>)}
              </div>
            </div>
          )}

          {/* ====== SERVICE DETAIL ====== */}
          <EditableBackground storageKey={`svc-detail.${type}.${activeService}`} className="services-page__detail animate-in" key={`${type}-${activeService}`}>
            <div className="services-page__detail-info">
              <EditableText value={t(`serviceData.${activeService}.title`)} tag="h2" className="services-page__detail-title" onSave={s(`serviceData.${activeService}.title`)} />
              <EditableText value={t(`serviceData.${activeService}.description`)} tag="p" className="services-page__detail-desc" onSave={s(`serviceData.${activeService}.description`)} />

              {activeService === 'security' && Array.isArray(benefits) ? (
                <div className="services-page__security-grid">
                  <div className="services-page__security-col">
                    <EditableText value={benefitsTitle} tag="h3" className="services-page__security-heading" onSave={s(`serviceData.${activeService}.benefitsTitle`)} />
                    <ul className="services-page__feature-list">
                      {benefits.map((f, i) => (
                        <li key={`${benefitsKey}-${i}-${f}`} className="services-page__feature-item">
                          <Check size={16} className="services-page__feature-check" />
                          <EditableText value={f} tag="span" onSave={(val) => handleFeatureListEdit(benefitsKey, benefits, i, val)} />
                          {isAdmin && editMode && (<button className="services-page__feat-delete" onClick={() => handleFeatureListDelete(benefitsKey, benefits, i)}><Trash2 size={12} /></button>)}
                        </li>
                      ))}
                    </ul>
                    {isAdmin && editMode && (<button className="services-page__feat-add" onClick={() => handleFeatureListAdd(benefitsKey, benefits)}><Plus size={14} /> Добавить пункт</button>)}
                  </div>
                  <div className="services-page__security-col">
                    <EditableText value={functionsTitle} tag="h3" className="services-page__security-heading" onSave={s(`serviceData.${activeService}.functionsTitle`)} />
                    <ul className="services-page__feature-list">
                      {Array.isArray(functions) && functions.map((f, i) => (
                        <li key={`${functionsKey}-${i}-${f}`} className="services-page__feature-item">
                          <Check size={16} className="services-page__feature-check" />
                          <EditableText value={f} tag="span" onSave={(val) => handleFeatureListEdit(functionsKey, functions, i, val)} />
                          {isAdmin && editMode && (<button className="services-page__feat-delete" onClick={() => handleFeatureListDelete(functionsKey, functions, i)}><Trash2 size={12} /></button>)}
                        </li>
                      ))}
                    </ul>
                    {isAdmin && editMode && (<button className="services-page__feat-add" onClick={() => handleFeatureListAdd(functionsKey, functions)}><Plus size={14} /> Добавить пункт</button>)}
                  </div>
                </div>
              ) : (
                <>
                  <ul className="services-page__feature-list">
                    {Array.isArray(currentFeatures) && currentFeatures.map((f, i) => (
                      <li key={`${featuresKey}-${i}-${f}`} className="services-page__feature-item">
                        <Check size={16} className="services-page__feature-check" />
                        <EditableText value={f} tag="span" onSave={(val) => handleFeatureListEdit(featuresKey, currentFeatures, i, val)} />
                        {isAdmin && editMode && (<button className="services-page__feat-delete" onClick={() => handleFeatureListDelete(featuresKey, currentFeatures, i)}><Trash2 size={12} /></button>)}
                      </li>
                    ))}
                  </ul>
                  {isAdmin && editMode && (<button className="services-page__feat-add" onClick={() => handleFeatureListAdd(featuresKey, currentFeatures)}><Plus size={14} /> Добавить пункт</button>)}
                </>
              )}

              {contentBlocks.map((block, i) => (
                <div key={`block-${i}`} className="services-page__content-block">
                  {isAdmin && editMode && (<button className="services-page__block-delete" onClick={() => handleDeleteContentBlock(i)}><Trash2 size={14} /></button>)}
                  {block.type === 'image' && (
                    <div className="services-page__content-image-wrap">
                      {block.src ? (
                        <EditableImage src={block.src} className="services-page__content-img" onSave={(url, file) => { if (file) handleContentImageUpload(i, file); }} />
                      ) : (
                        isAdmin && editMode ? (
                          <div className="services-page__upload-placeholder" onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = (e) => { if (e.target.files[0]) handleContentImageUpload(i, e.target.files[0]); }; input.click(); }}>
                            <Plus size={32} /><span>Загрузить картинку</span>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                  {block.type === 'text' && (<EditableText value={block.text} tag="p" className="services-page__content-text" onSave={(val) => handleEditContentBlock(i, 'text', val)} />)}
                  {block.type === 'section' && (
                    <EditableBackground storageKey={`svc-block.${activeService}.${i}`} className="services-page__content-section">
                      <EditableText value={block.title} tag="h3" className="services-page__detail-title" onSave={(val) => handleEditContentBlock(i, 'title', val)} />
                      <EditableText value={block.description} tag="p" className="services-page__detail-desc" onSave={(val) => handleEditContentBlock(i, 'description', val)} />
                      <ul className="services-page__feature-list">
                        {Array.isArray(block.features) && block.features.map((f, fi) => (
                          <li key={`block-${i}-feat-${fi}-${f}`} className="services-page__feature-item">
                            <Check size={16} className="services-page__feature-check" />
                            <EditableText value={f} tag="span" onSave={(val) => handleContentBlockFeatureEdit(i, fi, val)} />
                            {isAdmin && editMode && (<button className="services-page__feat-delete" onClick={() => handleContentBlockFeatureDelete(i, fi)}><Trash2 size={12} /></button>)}
                          </li>
                        ))}
                      </ul>
                      {isAdmin && editMode && (<button className="services-page__feat-add" onClick={() => handleContentBlockFeatureAdd(i)}><Plus size={14} /> Добавить пункт</button>)}
                    </EditableBackground>
                  )}
                </div>
              ))}

              {isAdmin && editMode && (
                <div className="services-page__add-blocks">
                  <button className="services-page__feat-add" onClick={() => handleAddContentBlock('section')}><Plus size={14} /> Добавить секцию</button>
                  <button className="services-page__feat-add" onClick={() => handleAddContentBlock('text')}><Plus size={14} /> Добавить текст</button>
                  <button className="services-page__feat-add" onClick={() => handleAddContentBlock('image')}><Plus size={14} /> Добавить картинку</button>
                </div>
              )}
            </div>
          </EditableBackground>

          {/* ====== SECURITY CTA ====== */}
          {activeService === 'security' && (
            <EditableBackground storageKey={`svc-cta.${type}`} className="services-page__custom-cta" id="plans">
              <EditableText value={typeof securityCta === 'string' ? securityCta : ''} tag="p" onSave={s(`serviceData.${activeService}.cta`)} />
              <a href="/contact" className="btn btn-primary">{t('services.requestQuote')}</a>
            </EditableBackground>
          )}

        </div>
      </section>
    </div>
  );
}

export default ServicesPage;
