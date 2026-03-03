import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { useLang } from '../LangContext.jsx';
import './PlanCard.css';

function PlanCard({ plan, delay = 0 }) {
  const navigate = useNavigate();
  const { t, lang } = useLang();

  const category = plan.category;
  const planKey = plan.name.toLowerCase();
  const featureKeys = t(`planFeatures.${category}.${planKey}`);
  const hasTranslation = Array.isArray(featureKeys) && featureKeys.length > 0;

  const handleSelect = () => {
    const params = new URLSearchParams({
      plan: plan.name,
      price: plan.price,
      lang: lang
    });
    navigate(`/contact?${params.toString()}`);
  };

  return (
    <div
      className="plan-card"
      style={{ animationDelay: `${delay}s` }}
    >
      <h3 className="plan-card__name">{plan.name}</h3>
      <div className="plan-card__price">
        <span className="plan-card__amount">{plan.price.toLocaleString()}</span>
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
              {text}
            </li>
          );
        })}
      </ul>
      <button
        className="btn btn-outline plan-card__btn"
        onClick={handleSelect}
      >
        {t('pricing.select')}
      </button>
    </div>
  );
}

export default PlanCard;
