import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Trash2, Plus } from 'lucide-react';
import { useLang } from '../LangContext.jsx';
import { useAdmin } from '../AdminContext.jsx';
import { EditableText } from './Editable.jsx';
import './PlanCard.css';

function PlanCard({ plan, delay = 0, onDelete, onUpdate }) {
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const { isAdmin, editMode } = useAdmin();

  const category = plan.category;
  const planKey = plan.name.toLowerCase();
  const featureKeys = t(`planFeatures.${category}.${planKey}`);
  const hasTranslation = Array.isArray(featureKeys) && featureKeys.length > 0;

  const handleSelect = () => {
    if (isAdmin && editMode) return;
    const params = new URLSearchParams({
      plan: plan.name,
      price: plan.price,
      lang: lang
    });
    navigate(`/contact?${params.toString()}`);
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
          value={plan.price.toLocaleString()}
          tag="span"
          className="plan-card__amount"
          onSave={(val) => onUpdate?.(plan.id, 'price', Number(val.replace(/\s/g, '')))}
        />
        <span className="plan-card__period"> lei/{t('pricing.month')}</span>
      </div>
      <ul className="plan-card__features">
        {plan.features.map((feature, i) => {
          const text = hasTranslation ? featureKeys[i] : feature.text;
          return (
            <li key={i} className={`plan-card__feature ${!feature.included ? 'plan-card__feature--disabled' : ''}`}>
              {feature.included
                ? <Check size={16} className="plan-card__check" />
                : <X size={16} className="plan-card__x" />
              }
              <EditableText value={text} tag="span" onSave={(val) => onUpdate?.(plan.id, `feature-${i}`, val)} />
            </li>
          );
        })}
      </ul>
      {isAdmin && editMode && (
        <button className="plan-card__add-feature" onClick={() => onUpdate?.(plan.id, 'addFeature', '')}>
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
