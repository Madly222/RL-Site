import React, { useState, useRef, useEffect } from 'react';
import { useAdmin } from '../AdminContext.jsx';
import { Pencil } from 'lucide-react';
import './Editable.css';

export function EditableText({ value, onSave, tag: Tag = 'span', className = '', style = {}, children }) {
  const { isAdmin, editMode } = useAdmin();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value || children);
  const ref = useRef(null);

  const displayValue = value || children;

  useEffect(() => {
    setText(displayValue);
  }, [displayValue]);

  if (!isAdmin || !editMode) {
    if (children) return <Tag className={className} style={style}>{children}</Tag>;
    return <Tag className={className} style={style}>{value}</Tag>;
  }

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setEditing(true);
    setTimeout(() => {
      if (ref.current) {
        ref.current.focus();
        // Place cursor at end
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
    if (newText !== displayValue && onSave) {
      onSave(newText);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && Tag !== 'p' && Tag !== 'div') {
      e.preventDefault();
      ref.current?.blur();
    }
    if (e.key === 'Escape') {
      setText(displayValue);
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
      {displayValue}
      <span className="editable__icon"><Pencil size={12} /></span>
    </Tag>
  );
}

export function EditableImage({ src, onSave, className = '', style = {}, alt = '' }) {
  const { isAdmin, editMode } = useAdmin();
  const fileRef = useRef(null);

  if (!isAdmin || !editMode) {
    return <img src={src} className={className} style={style} alt={alt} />;
  }

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (onSave) onSave(url, file);
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
