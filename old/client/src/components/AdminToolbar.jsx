import React, { useState } from 'react';
import { useAdmin } from '../AdminContext.jsx';
import { Edit3, Eye, LogOut, Save, Check } from 'lucide-react';
import './AdminToolbar.css';

function AdminToolbar() {
  const { isAdmin, editMode, setEditMode, logout } = useAdmin();
  const [saved, setSaved] = useState(false);

  if (!isAdmin) return null;

  const handleSave = async () => {
    // Future: save to server
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
            {saved ? <Check size={16} /> : <Save size={16} />}
            {saved ? 'Сохранено!' : 'Сохранить'}
          </button>
        )}
        <button className="admin-toolbar__btn admin-toolbar__btn--logout" onClick={logout}>
          <LogOut size={16} />
          Выйти
        </button>
      </div>
    </div>
  );
}

export default AdminToolbar;
