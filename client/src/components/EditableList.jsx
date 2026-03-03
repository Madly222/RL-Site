import React from 'react';
import { Check, Trash2, Plus } from 'lucide-react';
import { useAdmin } from '../AdminContext.jsx';
import { useLang } from '../LangContext.jsx';
import { EditableText } from './Editable.jsx';
import './EditableList.css';

function EditableList({ translationKey, items }) {
  const { isAdmin, editMode } = useAdmin();
  const { lang, setTranslation, tLang, setTranslationForLang } = useLang();
  const otherLang = lang === 'ro' ? 'ru' : 'ro';

  if (!Array.isArray(items) || items.length === 0) {
    if (isAdmin && editMode) {
      return (
        <div>
          <button className="editable-list__add" onClick={() => handleAdd()}>
            <Plus size={14} /> Добавить пункт
          </button>
        </div>
      );
    }
    return null;
  }

  const handleSave = (i, val) => {
    const newArr = [...items];
    newArr[i] = val;
    setTranslation(translationKey, newArr);
  };

  const handleDelete = (i) => {
    const newArr = [...items];
    newArr.splice(i, 1);
    setTranslation(translationKey, newArr);

    // Also delete from other language
    const otherArr = tLang(otherLang, translationKey);
    if (Array.isArray(otherArr)) {
      const otherCopy = [...otherArr];
      otherCopy.splice(i, 1);
      setTranslationForLang(otherLang, translationKey, otherCopy);
    }
  };

  const handleAdd = () => {
    const newText = lang === 'ro' ? 'Punct nou' : 'Новый пункт';
    const otherText = lang === 'ro' ? 'Новый пункт' : 'Punct nou';

    const newArr = Array.isArray(items) ? [...items, newText] : [newText];
    setTranslation(translationKey, newArr);

    const otherArr = tLang(otherLang, translationKey);
    const otherCopy = Array.isArray(otherArr) ? [...otherArr, otherText] : [otherText];
    setTranslationForLang(otherLang, translationKey, otherCopy);
  };

  return (
    <>
      <ul className="services-page__feature-list">
        {items.map((f, i) => (
          <li key={`${translationKey}-${i}-${f}`} className="services-page__feature-item">
            <Check size={16} className="services-page__feature-check" />
            <EditableText value={f} tag="span" onSave={(val) => handleSave(i, val)} />
            {isAdmin && editMode && (
              <button className="editable-list__delete" onClick={() => handleDelete(i)} title="Удалить">
                <Trash2 size={12} />
              </button>
            )}
          </li>
        ))}
      </ul>
      {isAdmin && editMode && (
        <button className="editable-list__add" onClick={handleAdd}>
          <Plus size={14} /> Добавить пункт
        </button>
      )}
    </>
  );
}

export default EditableList;
