import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Book, PlusCircle, Settings, Menu, X } from 'lucide-react';

const MainLayout = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
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
                background: '#fff',
                borderRight: '1px solid #eee',
                display: 'flex',
                flexDirection: 'column',
                position: 'sticky',
                top: 0,
                height: '100vh',
                zIndex: 90
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
                    <NavLink to="/"
                        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                        style={navStyle}
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <Book size={20} /> Meus Resumos
                    </NavLink>
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
                <Outlet />
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
