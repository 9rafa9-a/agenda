import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Book, PlusCircle, Settings, Menu, X, ChevronDown, ChevronRight, Hash } from 'lucide-react';
import DachshundMascot from '../fun/DachshundMascot';
import BackgroundSlideshow from './BackgroundSlideshow';

const MainLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data & Navigation State
  const [diseases, setDiseases] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectsOpen, setSubjectsOpen] = useState(true);

  const fetchDiseases = async () => {
    try {
      const q = query(collection(db, "diseases"), orderBy("lastEdited", "desc"));
      const querySnapshot = await getDocs(q);
      const list = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDiseases(list);

      // Extract unique subjects
      const uniqueSubjects = [...new Set(list.map(d => d.subject).filter(Boolean))].sort();
      setSubjects(uniqueSubjects);
    } catch (error) {
      console.error("Error fetching diseases:", error);
    }
  };

  React.useEffect(() => {
    fetchDiseases();
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'rgba(255,255,255,0.85)' }}>
      <BackgroundSlideshow />
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
          <NavLink to="/new"
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            style={navStyle}
            onClick={() => setMobileMenuOpen(false)}
          >
            <PlusCircle size={20} /> Novo Resumo
          </NavLink>
          {/* <NavLink to="/settings" style={navStyle}><Settings size={20} /> Ajustes</NavLink> */}
        </nav>

        <div style={{ fontSize: '0.8rem', color: '#ccc', textAlign: 'center' }}>
          v1.0.0
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto', paddingTop: '40px' }} className="main-content">
        <Outlet context={{ diseases, refresh: fetchDiseases }} />
      </main>

      {/* Global CSS for responsiveness */}
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
          }
          .sidebar.mobile-open {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

const navStyle = {
  textDecoration: 'none',
  // See CSS class above for hover/active
};

export default MainLayout;
