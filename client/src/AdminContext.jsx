import React, { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check if there's a saved token and verify it
  useEffect(() => {
    const saved = sessionStorage.getItem('adminToken');
    if (saved) {
      fetch('/api/auth/verify', {
        headers: { 'Authorization': 'Bearer ' + saved }
      })
        .then(r => r.json())
        .then(data => {
          if (data.valid) {
            setToken(saved);
            setIsAdmin(true);
            setEditMode(true);
          } else {
            sessionStorage.removeItem('adminToken');
          }
        })
        .catch(() => {
          sessionStorage.removeItem('adminToken');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success && data.token) {
        setToken(data.token);
        setIsAdmin(true);
        setEditMode(true);
        sessionStorage.setItem('adminToken', data.token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setIsAdmin(false);
    setEditMode(false);
    setToken(null);
    sessionStorage.removeItem('adminToken');
  };

  const getAuthHeaders = () => {
    if (!token) return {};
    return { 'Authorization': 'Bearer ' + token };
  };

  return (
    <AdminContext.Provider value={{ isAdmin, editMode, setEditMode, login, logout, token, getAuthHeaders, loading }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);