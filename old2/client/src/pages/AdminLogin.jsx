import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, LogIn } from 'lucide-react';
import { useAdmin } from '../AdminContext.jsx';
import './AdminLogin.css';

function AdminLogin() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const { login, isAdmin } = useAdmin();
  const navigate = useNavigate();

  if (isAdmin) {
    navigate('/');
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(user, pass)) {
      navigate('/');
    } else {
      setError('Неверный логин или пароль');
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__icon">
          <Lock size={32} />
        </div>
        <h1 className="admin-login__title">Admin Panel</h1>
        <p className="admin-login__subtitle">RapidLink CMS</p>
        <form onSubmit={handleSubmit} className="admin-login__form">
          <input
            type="text"
            placeholder="Login"
            value={user}
            onChange={e => setUser(e.target.value)}
            className="admin-login__input"
            autoFocus
          />
          <input
            type="password"
            placeholder="Password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            className="admin-login__input"
          />
          {error && <p className="admin-login__error">{error}</p>}
          <button type="submit" className="btn btn-primary admin-login__btn">
            <LogIn size={18} />
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
