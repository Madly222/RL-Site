import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Trash2, Plus } from 'lucide-react';
import { useLang } from '../LangContext.jsx';
import { useAdmin } from '../AdminContext.jsx';
import { EditableText, EditableImage } from './Editable.jsx';
import './PlanCard.css';

function PlanCard({ plan, delay = 0, onDelete, onUpdate }) {
  const navigate = useNavigate();
  const { t, lang, setTranslation, tLang, setTranslationForLang } = useLang();
  const { isAdmin, editMode } = useAdmin();

  const category = plan.category;
  const planKey = plan.name.toLowerCase();
  const tKey = `planFeatures.${category}.${planKey}`;
  const featureKeys = t(tKey);
  const hasTranslation = Array.isArray(featureKeys) && featureKeys.length > 0;
  const otherLang = lang === 'ro' ? 'ru' : 'ro';

  const handleSelect = () => {
    if (isAdmin && editMode) return;
    const params = new URLSearchParams({
      plan: plan.name,
      price: plan.price,
      lang: lang
    });
    navigate(`/contact?${params.toString()}`);
  };

  const getFeatureText = (feature, i) => {
    if (hasTranslation && featureKeys[i]) return featureKeys[i];
    return feature.text;
  };

  const handleFeatureSave = (i, val) => {
    onUpdate?.(plan.id, `feature-${i}`, val);
    const base = hasTranslation ? [...featureKeys] : plan.features.map(f => f.text);
    base[i] = val;
    setTranslation(`planFeatures.${category}.${planKey}`, base);
  };

  const handleFeatureDelete = (i) => {
    const currentArr = hasTranslation ? [...featureKeys] : plan.features.map(f => f.text);
    const otherArr = tLang(otherLang, tKey);
    const otherCopy = Array.isArray(otherArr) ? [...otherArr] : [...currentArr];
    currentArr.splice(i, 1);
    otherCopy.splice(i, 1);
    setTranslation(tKey, currentArr);
    setTranslationForLang(otherLang, tKey, otherCopy);
    onUpdate?.(plan.id, `deleteFeature-${i}`, null);
  };

  const handleFeatureAdd = () => {
    const currentArr = hasTranslation ? [...featureKeys] : plan.features.map(f => f.text);
    const otherArr = tLang(otherLang, tKey);
    const otherCopy = Array.isArray(otherArr) ? [...otherArr] : [...currentArr];
    const newTextCurrent = lang === 'ro' ? 'Punct nou' : 'Новый пункт';
    const newTextOther = lang === 'ro' ? 'Новый пункт' : 'Punct nou';
    currentArr.push(newTextCurrent);
    otherCopy.push(newTextOther);
    setTranslation(tKey, currentArr);
    setTranslationForLang(otherLang, tKey, otherCopy);
    onUpdate?.(plan.id, 'addFeature', '');
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', `plan-${plan.id}`);
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.url) onUpdate?.(plan.id, 'image', data.url);
      } catch {}
    };
    input.click();
  };

  const hasImage = !!plan.image;

  return (
    <div className={`plan-card ${hasImage ? 'plan-card--with-image' : ''}`} style={{ animationDelay: `${delay}s` }}>
      {isAdmin && editMode && (
        <button className="plan-card__delete" onClick={() => onDelete?.(plan.id)} title="Удалить план">
          <Trash2 size={14} />
        </button>
      )}

      <div className="plan-card__body">
        <div className="plan-card__info">
          <EditableText value={plan.name} tag="h3" className="plan-card__name" onSave={(val) => onUpdate?.(plan.id, 'name', val)} />
          <div className="plan-card__price">
            <EditableText
              value={String(plan.price)}
              tag="span"
              className="plan-card__amount"
              onSave={(val) => onUpdate?.(plan.id, 'price', Number(val.replace(/[^\d]/g, '')))}
            />
            <span className="plan-card__period"> lei/{t('pricing.month')}</span>
          </div>
          <ul className="plan-card__features">
            {plan.features.map((feature, i) => (
              <li key={`${plan.id}-feat-${i}-${feature.text}`} className={`plan-card__feature ${!feature.included ? 'plan-card__feature--disabled' : ''}`}>
                {isAdmin && editMode ? (
                  <button
                    className="plan-card__toggle-include"
                    onClick={() => onUpdate?.(plan.id, `toggleFeature-${i}`, !feature.included)}
                    title={feature.included ? 'Выключить' : 'Включить'}
                  >
                    {feature.included
                      ? <Check size={16} className="plan-card__check" />
                      : <X size={16} className="plan-card__x" />
                    }
                  </button>
                ) : (
                  feature.included
                    ? <Check size={16} className="plan-card__check" />
                    : <X size={16} className="plan-card__x" />
                )}
                <EditableText value={getFeatureText(feature, i)} tag="span" onSave={(val) => handleFeatureSave(i, val)} />
                {isAdmin && editMode && (
                  <button
                    className="plan-card__delete-feature"
                    onClick={() => handleFeatureDelete(i)}
                    title="Удалить пункт"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {isAdmin && editMode && (
            <button className="plan-card__add-feature" onClick={handleFeatureAdd}>
              <Plus size={14} /> Добавить пункт
            </button>
          )}
        </div>

        {/* Image area — right side */}
        {(hasImage || (isAdmin && editMode)) && (
          <div className="plan-card__image-area">
            {hasImage ? (
              <>
                <EditableImage
                  src={plan.image}
                  className="plan-card__img"
                  name={`plan-${plan.id}`}
                  onSave={(url) => onUpdate?.(plan.id, 'image', url)}
                />
                {isAdmin && editMode && (
                  <button className="plan-card__img-delete" onClick={() => onUpdate?.(plan.id, 'image', '')} title="Удалить фото">
                    <Trash2 size={12} />
                  </button>
                )}
              </>
            ) : (
              isAdmin && editMode && (
                <button className="plan-card__img-add" onClick={handleImageUpload}>
                  <Plus size={24} />
                  <span>Фото</span>
                </button>
              )
            )}
          </div>
        )}
      </div>

      <button className="btn btn-outline plan-card__btn" onClick={handleSelect}>
        {t('pricing.select')}
      </button>
    </div>
  );
}

export default PlanCard;