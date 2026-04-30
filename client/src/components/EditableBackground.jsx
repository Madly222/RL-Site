import React, { useState, useRef, useEffect } from 'react';
import { useAdmin } from '../AdminContext.jsx';
import { authFetch } from '../api.js';
import { ImagePlus, Trash2 } from 'lucide-react';
import './EditableBackground.css';

function EditableBackground({
  storageKey,
  className = '',
  style = {},
  overlayColor,
  tag: Tag = 'div',
  children,
  ...rest
}) {
  const { isAdmin, editMode } = useAdmin();
  const fileRef = useRef(null);
  const [bgUrl, setBgUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!storageKey) return;
    fetch('/api/translations/icons')
      .then(r => r.json())
      .then(data => {
        const key = `bg_${storageKey}`;
        if (data[key]) setBgUrl(data[key]);
      })
      .catch(() => {});
  }, [storageKey]);

  const saveToServer = (url) => {
    authFetch('/api/translations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: 'icons', key: `bg_${storageKey}`, value: url })
    }).catch(() => {});
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Файл слишком большой! Максимум: 2 МБ');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('name', `bg-${storageKey.replace(/\./g, '-')}-${Date.now()}`);
    try {
      const res = await authFetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) { setBgUrl(data.url); saveToServer(data.url); }
    } catch {} finally { setLoading(false); }
  };

  const handleRemove = () => { setBgUrl(''); saveToServer(''); };

  const hasBackground = !!bgUrl;
  const overlay = overlayColor || 'rgba(0, 0, 0, 0.08)';

  return (
    <Tag
      className={`editable-bg ${className} ${hasBackground ? 'editable-bg--has-image' : ''}`}
      style={{ ...style, position: 'relative' }}
      {...rest}
    >
      {/* Фоновая картинка — абсолютный img, не затирается CSS background */}
      {hasBackground && (
        <>
          <img
            src={bgUrl}
            alt=""
            className="editable-bg__img"
          />
          <div className="editable-bg__overlay" style={{ background: overlay }} />
        </>
      )}

      {/* Контент поверх фона */}
      <div className="editable-bg__content">
        {children}
      </div>

      {/* Кнопки админки */}
      {isAdmin && editMode && (
        <div className="editable-bg__controls">
          <button className="editable-bg__btn" onClick={() => fileRef.current?.click()} disabled={loading}>
            <ImagePlus size={14} />
            <span>{loading ? '...' : 'Фон'}</span>
          </button>
          {bgUrl && (
            <button className="editable-bg__btn editable-bg__btn--remove" onClick={handleRemove}>
              <Trash2 size={14} />
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
        </div>
      )}
    </Tag>
  );
}

export default EditableBackground;
