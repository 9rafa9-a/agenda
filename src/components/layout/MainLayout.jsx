import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Book, PlusCircle, Layout, Brain, Trash2, Menu, X, ChevronDown, ChevronRight, BarChart2, FileText, Settings, ShieldAlert, HelpCircle } from 'lucide-react';
import DachshundMascot from '../fun/DachshundMascot';
import BackgroundSlideshow from './BackgroundSlideshow';
import { useTour } from '../../contexts/TourContext';
import TourOverlay from '../tour/TourOverlay';

const MainLayout = () => {
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('app_user') || null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { startTour, active } = useTour();

  // Data & Navigation State
  const [rawDiseases, setRawDiseases] = useState([]);
  const [subjectsOpen, setSubjectsOpen] = useState(true);
  const [showMascots, setShowMascots] = useState(true); // Default true

  // User Identity State
  const [passwordInput, setPasswordInput] = useState(''); // New: Password State
  const [loginError, setLoginError] = useState(false); // New: Error State

  // TRIGGER TOUR FOR GUEST
  useEffect(() => {
    if (currentUser === 'Convidado') {
      const hasSeen = localStorage.getItem('hasSeenGuestTour');
      // Only start if not seen AND not currently active
      if (!hasSeen && !active) {
        const timer = setTimeout(() => startTour(), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [currentUser, startTour, active]);

  // Filter Data based on User (Sandbox Mode)
  const { displayDiseases, displaySubjects } = React.useMemo(() => {
    let filtered = rawDiseases;
    if (currentUser === 'Convidado') {
      filtered = rawDiseases.filter(d => d.isGuest === true);
    } else {
      filtered = rawDiseases.filter(d => !d.isGuest);
    }

    // Extract Subjects from filtered list
    const subjs = [...new Set(
      filtered.map(d => d.subject ? d.subject.split(',') : [])
        .flat()
        .map(s => s.trim())
        .filter(Boolean)
    )].sort();

    return { displayDiseases: filtered, displaySubjects: subjs };
  }, [rawDiseases, currentUser]);

  // Real-time subscription
  useEffect(() => {
    const q = query(collection(db, "diseases"), orderBy("lastEdited", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const list = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRawDiseases(list);
    }, (error) => {
      console.error("Error listening to diseases:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (user) => {
    if (user === 'Convidado') {
      setCurrentUser('Convidado');
      localStorage.setItem('app_user', 'Convidado');
      // Redirect to Analytics immediately if guest logs in
      navigate('/analytics');
      return;
    }

    if (passwordInput === 'juju2026') {
      setCurrentUser(user);
      localStorage.setItem('app_user', user);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('app_user');
    setMobileMenuOpen(false);
    setPasswordInput(''); // Reset password
    navigate('/'); // Go home
  };

  const fetchDiseases = () => { };

  // GLOBAL LOCK SCREEN
  if (!currentUser) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: '#f8f9fa', zIndex: 9999,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }}>
        <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '3.5rem', marginBottom: '10px', color: '#555' }}>
          Quem é você?
        </h1>
        <p style={{ marginBottom: '30px', color: '#888' }}>Digite a senha para acessar.</p>

        {/* Password Input */}
        <input
          type="password"
          placeholder="******"
          value={passwordInput}
          onChange={e => { setPasswordInput(e.target.value); setLoginError(false); }}
          style={{
            padding: '12px 20px', fontSize: '1.2rem', borderRadius: '12px',
            border: loginError ? '2px solid #ff6b6b' : '2px solid #ddd',
            marginBottom: '30px', width: '280px', outline: 'none', textAlign: 'center'
          }}
        />
        {loginError && <p style={{ color: '#ff6b6b', marginTop: '-20px', marginBottom: '20px', fontWeight: 'bold' }}>Senha incorreta!</p>}

        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Rafa Button */}
          <button
            onClick={() => handleLogin('Rafa')}
            style={{
              background: '#e3f2fd', color: '#1565c0',
              border: '2px solid #bbdefb', borderRadius: '30px',
              padding: '30px 50px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
              transition: 'transform 0.2s', opacity: passwordInput ? 1 : 0.5
            }}
          >
            <span style={{ fontSize: '3rem' }}>👨🏻‍🦰</span>
            <span style={{ fontSize: '1.5rem', fontFamily: 'var(--font-hand)', fontWeight: 'bold' }}>Dr. Rafa</span>
          </button>

          {/* Ju Button */}
          <button
            onClick={() => handleLogin('Ju')}
            style={{
              background: '#fce4ec', color: '#c2185b',
              border: '2px solid #f8bbd0', borderRadius: '30px',
              padding: '30px 50px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
              transition: 'transform 0.2s', opacity: passwordInput ? 1 : 0.5
            }}
          >
            <span style={{ fontSize: '3rem' }}>👩🏻‍🦰</span>
            <span style={{ fontSize: '1.5rem', fontFamily: 'var(--font-hand)', fontWeight: 'bold' }}>Dra. Ju</span>
          </button>
        </div>

        {/* Guest Button */}
        <button
          onClick={() => handleLogin('Convidado')}
          style={{
            marginTop: '40px', background: 'none', border: 'none',
            color: '#888', textDecoration: 'underline', cursor: 'pointer', fontSize: '1rem',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <ShieldAlert size={16} /> Entrar como Convidado (Modo Visitante)
        </button>
      </div >
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'var(--font-main)', background: '#f8f9fa' }}>
      <TourOverlay />

      {/* Background Logic */}
      {currentUser === 'Convidado' ? (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1,
          background: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)'
        }} />
      ) : (
        <BackgroundSlideshow />
      )}

      <DachshundMascot />

      {/* Mobile Header */}
      <div className="mobile-header" style={{
        display: 'none',
        position: 'fixed', top: 0, left: 0, right: 0, height: '60px',
        background: '#fff', borderBottom: '1px solid #eee', zIndex: 100,
        alignItems: 'center', padding: '0 20px', justifyContent: 'space-between'
      }}>
        <h1 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.5rem', color: 'var(--color-primary)' }}>Minha Residência</h1>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
        />
      )}

      {/* Sidebar (Desktop) */}
      <aside style={{ width: '250px', padding: '32px' }} className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>

        <div className="mobile-only" style={{ height: '40px', display: 'none' }}></div>

        <h1 className="desktop-logo" style={{
          fontFamily: 'var(--font-hand)', fontSize: '2.5rem', color: 'var(--color-primary)',
          marginBottom: '48px', textAlign: 'center'
        }}>
          Minha Residência
        </h1>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <NavLink to="/" end
            className={({ isActive }) => isActive && !window.location.search.includes('trash') ? 'nav-item active' : 'nav-item'}
            style={navStyle}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Book size={20} /> Todos os Resumos
          </NavLink>

          <NavLink id="nav-new" to="/new"
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            style={navStyle}
            onClick={() => setMobileMenuOpen(false)}
          >
            <PlusCircle size={20} /> Novo Resumo
          </NavLink>

          {/* Collapsible Subjects */}
          <div>
            <div
              style={{
                padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', color: '#888', fontSize: '0.9rem',
                fontWeight: '600', textTransform: 'uppercase'
              }}
              onClick={() => setSubjectsOpen(!subjectsOpen)}
            >
              <span>Matérias</span>
              {subjectsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>

            {subjectsOpen && (
              <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {displaySubjects.length === 0 && <span style={{ padding: '8px 16px', fontSize: '0.8rem', color: '#aaa', fontStyle: 'italic' }}>Sem matérias ainda...</span>}
                {displaySubjects.map(subj => (
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

          <NavLink id="nav-flashcards" to="/flashcards"
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            style={{ ...navStyle, marginBottom: '8px' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Brain size={20} /> Flashcards (AI)
          </NavLink>

          <NavLink id="nav-quizzes" to="/quizzes"
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            style={{ ...navStyle, marginBottom: '8px' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <FileText size={20} /> Provinhas 📝
          </NavLink>

          <NavLink id="nav-analytics" to="/analytics"
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            style={{ ...navStyle, marginBottom: '8px' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <BarChart2 size={20} /> Raio-X (Stats) 📊
          </NavLink>

          <NavLink to="/?trash=true"
            className={({ isActive }) => window.location.search.includes('trash=true') ? 'nav-item active' : 'nav-item'}
            style={{ ...navStyle, marginTop: '16px', color: '#ff6b6b' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <Trash2 size={20} /> Lixeira
          </NavLink>

          <div style={{ flex: 1 }}></div>

          <NavLink id="nav-help" to="/help"
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            style={{ ...navStyle, marginTop: 'auto', borderTop: '1px solid #eee', paddingTop: '16px' }}
            onClick={() => setMobileMenuOpen(false)}
          >
            <HelpCircle size={20} /> Ajuda / Sobre
          </NavLink>

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
                background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                gap: '12px', fontSize: '0.9rem', color: showMascots ? 'var(--color-primary)' : '#aaa', width: '100%', padding: '8px 16px'
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

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto', paddingTop: '40px' }} className="main-content">
        <Outlet context={{ diseases: displayDiseases, refresh: fetchDiseases, currentUser }} key={location.pathname + location.search} />
      </main>

      <style>{`
        .nav-item {
          display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px;
          color: var(--color-text-light); font-weight: 500; transition: all 0.2s;
        }
        .nav-item:hover { background: var(--color-secondary-light); color: var(--color-text); }
        .nav-item.active { background: var(--color-primary-light); color: var(--color-primary); font-weight: 600; }
        .nav-item.active-sub { color: var(--color-primary); font-weight: 600; background: rgba(0,0,0,0.02); }
        .nav-item.sub:hover { background: rgba(0,0,0,0.02); }

        @media (max-width: 768px) {
          .desktop-sidebar { display: none; }
          .mobile-header { display: flex !important; }
          .main-content { padding: 20px !important; padding-top: 80px !important; }
          .desktop-logo { display: none; }
          .mobile-only { display: block !important; }
          
          .sidebar {
            position: fixed !important; top: 60px !important; left: 0; bottom: 0;
            width: 100% !important; transform: translateX(-100%); transition: transform 0.3s ease;
            border-right: none !important; background: #fff !important; z-index: 200;
            box-shadow: 2px 0 8px rgba(0,0,0,0.1);
          }
          .sidebar.mobile-open { transform: translateX(0); }
        }
      `}</style>
    </div >
  );
};

const navStyle = {
  textDecoration: 'none',
};

export default MainLayout;
