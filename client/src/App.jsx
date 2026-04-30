import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { LangProvider } from './LangContext.jsx';
import { ThemeProvider } from './ThemeContext.jsx';
import { AdminProvider } from './AdminContext.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import AdminToolbar from './components/AdminToolbar.jsx';
import HomePage from './pages/HomePage.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import DocumentsPage from './pages/DocumentsPage.jsx';
import AdminLogin from './pages/AdminLogin.jsx';

function ScrollHandler() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash.replace('#', ''));
        if (el) {
          const rect = el.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const targetTop = scrollTop + rect.top - (window.innerHeight - rect.height - 40);
          window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
        }
      }, 200);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  return null;
}

function AppContent() {
  const location = useLocation();
  const isAdminLogin = location.pathname === '/admin';

  if (isAdminLogin) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminLogin />} />
      </Routes>
    );
  }

  return (
    <>
      <ScrollHandler />
      <div className="app">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/personal" element={<ServicesPage type="personal" />} />
            <Route path="/business" element={<ServicesPage type="business" />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/documents/:category" element={<DocumentsPage />} />
          </Routes>
        </main>
        <Footer />
        <AdminToolbar />
      </div>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LangProvider>
        <AdminProvider>
          <Router>
            <AppContent />
          </Router>
        </AdminProvider>
      </LangProvider>
    </ThemeProvider>
  );
}

export default App;