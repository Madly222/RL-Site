import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Trash2, Plus } from 'lucide-react';
import { useLang } from '../LangContext.jsx';
import { useAdmin } from '../AdminContext.jsx';
import { EditableText } from './Editable.jsx';
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
    // Save to plan data on server
    onUpdate?.(plan.id, `feature-${i}`, val);
    // Save to current language translation (create array if needed)
    const base = hasTranslation ? [...featureKeys] : plan.features.map(f => f.text);
    base[i] = val;
    setTranslation(`planFeatures.${category}.${planKey}`, base);
  };

  const handleFeatureDelete = (i) => {
    // Get current arrays for both languages
    const currentArr = hasTranslation ? [...featureKeys] : plan.features.map(f => f.text);
    const otherArr = tLang(otherLang, tKey);
    const otherCopy = Array.isArray(otherArr) ? [...otherArr] : [...currentArr];

    // Remove same index from both
    currentArr.splice(i, 1);
    otherCopy.splice(i, 1);

    // Save both languages
    setTranslation(tKey, currentArr);
    setTranslationForLang(otherLang, tKey, otherCopy);

    // Update plan on server
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

  return (
    <div className="plan-card" style={{ animationDelay: `${delay}s` }}>
      {isAdmin && editMode && (
        <button className="plan-card__delete" onClick={() => onDelete?.(plan.id)} title="Удалить план">
          <Trash2 size={14} />
        </button>
      )}
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
      <button className="btn btn-outline plan-card__btn" onClick={handleSelect}>
        {t('pricing.select')}
      </button>
    </div>
  );
}

export default PlanCard;
