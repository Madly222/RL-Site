import React, { useState, useEffect } from 'react';
import { useAdmin } from '../AdminContext.jsx';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../api.js';
import { Edit3, Eye, LogOut, Save, Check, Trash2, Key, Loader, FolderOpen } from 'lucide-react';
import './AdminToolbar.css';

function AdminToolbar() {
  const { isAdmin, editMode, setEditMode, logout } = useAdmin();
  const navigate = useNavigate();
  const [saveStatus, setSaveStatus] = useState(null);
  const [cleanupStatus, setCleanupStatus] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [passStatus, setPassStatus] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      document.body.style.paddingBottom = '56px';
    }
    return () => { document.body.style.paddingBottom = ''; };
  }, [isAdmin]);

  if (!isAdmin) return null;

  const handleSave = () => {
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const handleCleanup = async () => {
    if (!confirm('Удалить все неиспользуемые изображения с сервера?')) return;
    setCleanupStatus('loading');
    try {
      const res = await authFetch('/api/cleanup-images', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setCleanupStatus(`Удалено: ${data.deleted} файл(ов), освобождено ${data.freedMB} МБ`);
      } else {
        setCleanupStatus('Ошибка: ' + (data.error || 'неизвестная'));
      }
    } catch {
      setCleanupStatus('Ошибка соединения');
    }
    setTimeout(() => setCleanupStatus(null), 5000);
  };

  const handleChangePassword = async () => {
    if (passwords.newPass !== passwords.confirm) {
      setPassStatus('Пароли не совпадают');
      setTimeout(() => setPassStatus(null), 3000);
      return;
    }
    if (passwords.newPass.length < 6) {
      setPassStatus('Минимум 6 символов');
      setTimeout(() => setPassStatus(null), 3000);
      return;
    }
    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPass })
      });
      const data = await res.json();
      if (data.success) {
        setPassStatus('Пароль изменён!');
        setPasswords({ current: '', newPass: '', confirm: '' });
        setTimeout(() => { setPassStatus(null); setShowPassword(false); }, 2000);
      } else {
        setPassStatus(data.error || 'Ошибка');
        setTimeout(() => setPassStatus(null), 3000);
      }
    } catch {
      setPassStatus('Ошибка соединения');
      setTimeout(() => setPassStatus(null), 3000);
    }
  };

  return (
    <div className="admin-toolbar">
      <div className="admin-toolbar__inner">
        <span className="admin-toolbar__badge">ADMIN</span>

        <button
          className={`admin-toolbar__btn ${editMode ? 'admin-toolbar__btn--active' : ''}`}
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? <Eye size={16} /> : <Edit3 size={16} />}
          {editMode ? 'Предпросмотр' : 'Редактировать'}
        </button>

        {editMode && (
          <button className="admin-toolbar__btn admin-toolbar__btn--save" onClick={handleSave}>
            {saveStatus === 'saved' ? <Check size={16} /> : <Save size={16} />}
            {saveStatus === 'saved' ? 'Всё сохранено!' : 'Сохраняется автоматически'}
          </button>
        )}

        {editMode && (
          <button
            className="admin-toolbar__btn admin-toolbar__btn--cleanup"
            onClick={handleCleanup}
            disabled={cleanupStatus === 'loading'}
          >
            {cleanupStatus === 'loading' ? <Loader size={16} className="admin-toolbar__spin" /> : <Trash2 size={16} />}
            {typeof cleanupStatus === 'string' && cleanupStatus !== 'loading' ? cleanupStatus : 'Очистить фото'}
          </button>
        )}

        <button
          className="admin-toolbar__btn admin-toolbar__btn--docs"
          onClick={() => navigate('/documents/calitatea-serviciilor')}
        >
          <FolderOpen size={16} />
          Документы
        </button>

        <button
          className="admin-toolbar__btn admin-toolbar__btn--key"
          onClick={() => setShowPassword(!showPassword)}
        >
          <Key size={16} />
          Пароль
        </button>

        <button className="admin-toolbar__btn admin-toolbar__btn--logout" onClick={logout}>
          <LogOut size={16} />
          Выйти
        </button>
      </div>

      {showPassword && (
        <div className="admin-toolbar__password-panel">
          <input
            type="password"
            placeholder="Текущий пароль"
            value={passwords.current}
            onChange={(e) => setPasswords(p => ({ ...p, current: e.target.value }))}
          />
          <input
            type="password"
            placeholder="Новый пароль (мин. 6)"
            value={passwords.newPass}
            onChange={(e) => setPasswords(p => ({ ...p, newPass: e.target.value }))}
          />
          <input
            type="password"
            placeholder="Подтвердите пароль"
            value={passwords.confirm}
            onChange={(e) => setPasswords(p => ({ ...p, confirm: e.target.value }))}
          />
          <button className="admin-toolbar__btn admin-toolbar__btn--save" onClick={handleChangePassword}>
            <Check size={14} /> Сменить
          </button>
          {passStatus && <span className="admin-toolbar__pass-status">{passStatus}</span>}
        </div>
      )}
    </div>
  );
}

export default AdminToolbar;