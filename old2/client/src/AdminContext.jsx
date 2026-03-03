import React, { createContext, useContext, useState } from 'react';

const AdminContext = createContext();

export function AdminProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const login = (user, pass) => {
    if (user === 'admin' && pass === 'admin') {
      setIsAdmin(true);
      setEditMode(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    setEditMode(false);
  };

  return (
    <AdminContext.Provider value={{ isAdmin, editMode, setEditMode, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
