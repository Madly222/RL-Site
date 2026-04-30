import React, { useState, useRef, useEffect } from 'react';
import { useAdmin } from '../AdminContext.jsx';
import { authFetch } from '../api.js';
import { Pencil } from 'lucide-react';
import './Editable.css';

export function EditableText({ value, onSave, translationKey, tag: Tag = 'span', className = '', style = {} }) {
  const { isAdmin, editMode } = useAdmin();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const ref = useRef(null);

  useEffect(() => {
    setText(value);
  }, [value]);

  if (!isAdmin || !editMode) {
    return <Tag className={className} style={style}>{value}</Tag>;
  }

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditing(true);
    setTimeout(() => {
      if (ref.current) {
        ref.current.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(ref.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }, 10);
  };

  const handleBlur = () => {
    setEditing(false);
    const newText = ref.current?.textContent || text;
    if (newText !== value) {
      setText(newText);
      if (onSave) onSave(newText);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && Tag !== 'p' && Tag !== 'div') {
      e.preventDefault();
      ref.current?.blur();
    }
    if (e.key === 'Escape') {
      setText(value);
      ref.current.textContent = value;
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <Tag
        ref={ref}
        className={`${className} editable editable--editing`}
        style={style}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      >
        {text}
      </Tag>
    );
  }

  return (
    <Tag className={`${className} editable`} style={style} onClick={handleClick}>
      {value}
      <span className="editable__icon"><Pencil size={12} /></span>
    </Tag>
  );
}

// Size hints based on className or name
function getSizeHint(className, name) {
  const cl = (className || '').toLowerCase();
  const nm = (name || '').toLowerCase();

  if (cl.includes('banner') || nm.includes('banner')) {
    return { res: '1920×400', max: '500 КБ' };
  }
  if (cl.includes('hero-window') || nm.includes('special')) {
    return { res: '1120×640', max: '300 КБ' };
  }
  if (cl.includes('detail-img') || nm.includes('service-')) {
    return { res: '560×400', max: '200 КБ' };
  }
  if (cl.includes('plan-card') || nm.includes('plan-')) {
    return { res: '280×280', max: '150 КБ' };
  }
  if (cl.includes('icon-link') || nm.includes('header-link')) {
    return { res: '64×64', max: '20 КБ' };
  }
  if (cl.includes('content-img')) {
    return { res: '1200×600', max: '500 КБ' };
  }
  return { res: '800×600', max: '300 КБ' };
}

export function EditableImage({ src, onSave, className = '', style = {}, alt = '', name = '' }) {
  const { isAdmin, editMode } = useAdmin();
  const fileRef = useRef(null);
  const hint = getSizeHint(className, name);

  if (!isAdmin || !editMode) {
    return <img src={src} className={className} style={style} alt={alt} />;
  }

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size
    const maxBytes = parseMaxBytes(hint.max);
    if (file.size > maxBytes) {
      alert(`Файл слишком большой! Максимум: ${hint.max}\nВаш файл: ${(file.size / 1024).toFixed(0)} КБ`);
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('name', name || 'img-' + Date.now());
    try {
      const res = await authFetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url && onSave) onSave(data.url);
    } catch {
      const url = URL.createObjectURL(file);
      if (onSave) onSave(url);
    }
  };

  return (
    <div className="editable-img">
      <img src={src} className={className} style={style} alt={alt} />
      <button className="editable-img__btn" onClick={() => fileRef.current?.click()}>
        <Pencil size={14} />
        Заменить
      </button>
      <div className="editable-img__hint">
        {hint.res} • макс. {hint.max}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
    </div>
  );
}

function parseMaxBytes(str) {
  const num = parseFloat(str);
  if (str.includes('МБ') || str.includes('MB')) return num * 1024 * 1024;
  return num * 1024; // КБ by default
}