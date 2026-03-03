import React, { useState, useRef, useEffect } from 'react';
import { useAdmin } from '../AdminContext.jsx';
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

export function EditableImage({ src, onSave, className = '', style = {}, alt = '', name = '' }) {
  const { isAdmin, editMode } = useAdmin();
  const fileRef = useRef(null);

  if (!isAdmin || !editMode) {
    return <img src={src} className={className} style={style} alt={alt} />;
  }

  const handleChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('name', name || 'img-' + Date.now());

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url && onSave) onSave(data.url);
    } catch {
      // Fallback to local preview
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
