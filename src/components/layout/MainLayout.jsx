import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Book, PlusCircle, Settings, Menu, X, ChevronDown, ChevronRight, Hash, Trash2, Brain, User, FileText, BarChart2 } from 'lucide-react';
import DachshundMascot from '../fun/DachshundMascot';
import BackgroundSlideshow from './BackgroundSlideshow';

const MainLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Data & Navigation State
  const [diseases, setDiseases] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectsOpen, setSubjectsOpen] = useState(true);
  const [showMascots, setShowMascots] = useState(true); // Default true

  // Real-time subscription
  React.useEffect(() => {
    const q = query(collection(db, "diseases"), orderBy("lastEdited", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const list = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDiseases(list);

      // Extract unique subjects (Split by comma and trim)
      const uniqueSubjects = [...new Set(
        list.map(d => d.subject ? d.subject.split(',') : [])
          .flat()
          .map(s => s.trim())
          .filter(Boolean)
      )].sort();
      setSubjects(uniqueSubjects);
    }, (error) => {
      console.error("Error listening to diseases:", error);
    });

    return () => unsubscribe();
  }, []);

  // User Identity State
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('app_user') || null);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('app_user', user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('app_user');
    setMobileMenuOpen(false);
  };

  // Manual refresh no longer needed but kept for context if needed
  const fetchDiseases = () => { };

  // GLOBAL LOCK SCREEN
  if (!currentUser) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: '#f8f9fa', zIndex: 9999,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }}>
        <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '3.5rem', marginBottom: '40px', color: '#555' }}>
          Quem é você?
        </h1>
        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Rafa Button */}
          <button
            onClick={() => handleLogin('Rafa')}
            style={{
              background: '#e3f2fd', color: '#1565c0',
              border: '2px solid #bbdefb', borderRadius: '30px',
              padding: '40px 60px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 12px rgba(21, 101, 192, 0.1)'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span style={{ fontSize: '4rem' }}>👨🏻‍🦰</span>
            <span style={{ fontSize: '2rem', fontFamily: 'var(--font-hand)', fontWeight: 'bold' }}>Dr. Rafa</span>
          </button>

          {/* Ju Button */}
          <button
            onClick={() => handleLogin('Ju')}
            style={{
              background: '#fce4ec', color: '#c2185b',
              border: '2px solid #f8bbd0', borderRadius: '30px',
              padding: '40px 60px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 12px rgba(194, 24, 91, 0.1)'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span style={{ fontSize: '4rem' }}>👩🏻‍🦰</span>
            <span style={{ fontSize: '2rem', fontFamily: 'var(--font-hand)', fontWeight: 'bold' }}>Dra. Ju</span>
          </button>
        </div>
        <p style={{ marginTop: '40px', color: '#aaa' }}>Selecione para carregar seu progresso personalizado.</p>
      </div >
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent' }}>
      <BackgroundSlideshow />
      <DachshundMascot />
      {/* Mobile Header */}
      <div className="mobile-header" style={{
        display: 'none', // Hidden on desktop
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: '#fff',
        borderBottom: '1px solid #eee',
        zIndex: 100,
        alignItems: 'center',
        padding: '0 20px',
        justifyContent: 'space-between'
      }}>
        <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.5rem', color: 'var(--color-primary)' }}>My Residência</h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar (Desktop) */}
      <aside style={{
        width: '250px',
        padding: '32px',
      }} className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>

        {/* Mobile-only close button/padding adjustment */}
        <div className="mobile-only" style={{ height: '40px', display: 'none' }}></div>

        <h1 className="desktop-logo" style={{
          fontFamily: 'var(--font-hand)',
          fontSize: '2.5rem',
          color: 'var(--color-primary)',
          marginBottom: '48px',
          textAlign: 'center'
        }}>
          My Residência
        </h1>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <NavLink to="/" end
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            style={navStyle}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Book size={20} /> Todos os Resumos
          </NavLink>

          {/* Collapsible Subjects */}
          <div>
            <div
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#888',
                fontSize: '0.9rem',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}
              onClick={() => setSubjectsOpen(!subjectsOpen)}
            >
              <span>Matérias</span>
              {subjectsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>

            {subjectsOpen && (
              <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {subjects.length === 0 && <span style={{ padding: '8px 16px', fontSize: '0.8rem', color: '#aaa', fontStyle: 'italic' }}>Sem matérias ainda...</span>}
                {subjects.map(subj => (
                  <NavLink
                    key={subj}
                    to={`/?subject=${encodeURIComponent(subj)}`}
                    className={({ isActive }) => isActive || window.location.search.includes(`subject=${encodeURIComponent(subj)}`) ? 'nav-item active-sub' : 'nav-item sub'}
                    style={{ ...navStyle, fontSize: '0.9rem', padding: '8px 12px' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)', opacity: 0.5 }}></div>
                    {subj}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          <NavLink to="/flashcards"
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            style={{
              ...navStyle,
              marginBottom: '8px'
            }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Brain size={20} />
            Flashcards (AI)
          </NavLink>

          <NavLink to="/quizzes"
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            style={{
              ...navStyle,
              marginBottom: '8px'
            }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <FileText size={20} />
            Provinhas 📝
          </NavLink>

          Provinhas 📝
        </NavLink>

        <NavLink to="/analytics"
          className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
          style={{
            ...navStyle,
            marginBottom: '8px'
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <BarChart2 size={20} />
          Raio-X (Stats) 📊
        </NavLink>

        <NavLink to="/new"
          className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
          style={navStyle}
          onClick={() => setMobileMenuOpen(false)}
        >
          <PlusCircle size={20} /> Novo Resumo
        </NavLink>

        <NavLink to="/?trash=true"
          className={({ isActive }) => window.location.search.includes('trash=true') ? 'nav-item active' : 'nav-item'}
          style={{ ...navStyle, marginTop: '16px', color: '#ff6b6b' }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <Trash2 size={20} /> Lixeira
        </NavLink>
        {/* <NavLink to="/settings" style={navStyle}><Settings size={20} /> Ajustes</NavLink> */}

        {/* User Profile */}
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #eee' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', padding: '0 8px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: currentUser === 'Rafa' ? '#e3f2fd' : '#fce4ec',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem'
            }}>
              {currentUser === 'Rafa' ? '👨🏻‍🦰' : '👩🏻‍🦰'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', color: '#555' }}>{currentUser}</div>
              <button onClick={handleLogout} style={{ fontSize: '0.7rem', color: '#888', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
                Sair / Trocar
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowMascots(!showMascots)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '0.9rem',
              color: showMascots ? 'var(--color-primary)' : '#aaa',
              width: '100%',
              padding: '8px 16px'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{showMascots ? '🐶' : '🚫'}</span>
            {showMascots ? 'Salsichas: On' : 'Salsichas: Off'}
          </button>
        </div>
      </nav>

      <div style={{ fontSize: '0.8rem', color: '#ccc', textAlign: 'center', marginTop: '16px' }}>
        v1.0.0
      </div>
    </aside>

      {/* Main Content */ }
  <main style={{ flex: 1, padding: '40px', overflowY: 'auto', paddingTop: '40px' }} className="main-content">
    <Outlet context={{ diseases, refresh: fetchDiseases, currentUser }} key={location.pathname + location.search} />
  </main>

  {/* Global CSS for responsiveness */ }
  <style>{`
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          color: var(--color-text-light);
          font-weight: 500;
          transition: all 0.2s;
        }
        .nav-item:hover {
          background: var(--color-secondary-light);
          color: var(--color-text);
        }
        .nav-item.active {
          background: var(--color-primary-light);
          color: var(--color-primary);
          font-weight: 600;
        }
        .nav-item.active-sub {
            color: var(--color-primary);
            font-weight: 600;
            background: rgba(0,0,0,0.02);
        }
        .nav-item.sub:hover {
            background: rgba(0,0,0,0.02);
        }

        @media (max-width: 768px) {
          .desktop-sidebar { 
            display: none; 
          }
          .mobile-header {
            display: flex !important;
          }
          .main-content {
            padding: 20px !important;
            padding-top: 80px !important; /* Space for header */
          }
          .desktop-logo {
            display: none;
          }
          .mobile-only {
            display: block !important;
          }
          
          /* Mobile Sidebar Drawer */
          .sidebar {
            position: fixed !important;
            top: 60px !important;
            left: 0;
            bottom: 0;
            width: 100% !important;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            border-right: none !important;
            background: #fff !important; /* Solid white to prevent overlap issues */
            z-index: 200;
            box-shadow: 2px 0 8px rgba(0,0,0,0.1);
          }
          .sidebar.mobile-open {
            transform: translateX(0);
          }
        }
      `}</style>
    </div >
  );
};

const navStyle = {
  textDecoration: 'none',
  // See CSS class above for hover/active
};

export default MainLayout;
