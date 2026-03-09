import React, { useEffect, useState } from 'react';
import useAppStore from './stores/appStore';
import useTranslation from './hooks/useTranslation';
import Sidebar from './components/Sidebar';
import NavigatorSidebar from './components/NavigatorSidebar';
import SearchBar from './components/SearchBar';
import CommandPalette from './components/CommandPalette';
import Dashboard from './pages/Dashboard';
import Viewer from './pages/Viewer';
import Comparison from './pages/Comparison';
import Collections from './pages/Collections';
import Auth from './pages/Auth';
import ProfileModal from './components/ProfileModal';
import { onSessionChange, cerrarSesion } from './services/firebase';

export default function App() {
  const currentView = useAppStore(s => s.currentView);
  const user = useAppStore(s => s.user);
  const setUser = useAppStore(s => s.setUser);
  const [authChecking, setAuthChecking] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const toast = useAppStore(s => s.toast);
  const loadCollections = useAppStore(s => s.loadCollections);
  const theme = useAppStore(s => s.theme);
  const { t } = useTranslation();

  // Initialize theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auth Observer
  useEffect(() => {
    const unsubscribe = onSessionChange((currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, [setUser]);

  useEffect(() => {
    loadCollections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        const openTabs = useAppStore.getState().openTabs;
        if (openTabs[index]) {
          useAppStore.getState().setActiveTab(openTabs[index].id);
          useAppStore.getState().setView('viewer');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'viewer': return <Viewer />;
      case 'comparison': return <Comparison />;
      case 'collections': return <Collections />;
      default: return <Dashboard />;
    }
  };

  const viewTitle = {
    dashboard: `🏠 ${t('dashboard')}`,
    viewer: `📄 ${t('viewer')}`,
    comparison: `🔀 ${t('compare')}`,
    collections: `📁 ${t('collections')}`,
  };

  if (authChecking) {
    return <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  if (!user) {
    return (
      <div className="app-layout">
        <div className="app-main" style={{ marginLeft: 0 }}>
          <Auth />
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <CommandPalette />
      <Sidebar />
      {currentView === 'viewer' && <NavigatorSidebar />}
      <div className="app-main">
        {currentView !== 'viewer' && (
          <div className="app-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontWeight: 600, fontSize: 16 }}>{viewTitle[currentView]}</span>
              <div 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 6, 
                  padding: '4px 12px', background: 'var(--color-primary-lighter)', 
                  color: 'var(--color-primary)', borderRadius: 'var(--radius-full)', 
                  fontSize: 12, fontWeight: 500 
                }}
                title="Current Storage"
              >
                <span>💾 {t('localStorage')}</span>
              </div>
            </div>
            <SearchBar />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="btn btn-icon btn-ghost" title={t('notifications')}>🔔</button>
              
              <div style={{ position: 'relative' }}>
                <div 
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--color-primary-gradient)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer'
                  }}
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  title={t('profile') || "Profile"}
                >
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>

                {showProfileMenu && (
                  <>
                    {/* Invisible overlay to close menu when clicking outside */}
                    <div 
                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }} 
                      onClick={() => setShowProfileMenu(false)}
                    />
                    
                    <div style={{
                      position: 'absolute', top: 40, right: 0, 
                      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)', padding: '8px 0', minWidth: 220,
                      boxShadow: 'var(--shadow-lg)', zIndex: 100, display: 'flex', flexDirection: 'column'
                    }}>
                      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--color-border)', marginBottom: 8 }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)', wordBreak: 'break-all' }}>
                          {user?.email || (t('guestUser') || 'Invitado')}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                          {user?.isAnonymous ? 'Modo Local' : 'Cloud Sync'}
                        </div>
                      </div>
                      
                      <button 
                        style={{ 
                          width: '100%', textAlign: 'left', padding: '10px 16px', 
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 12
                        }}
                        onMouseEnter={e => e.target.style.background = 'var(--color-bg)'}
                        onMouseLeave={e => e.target.style.background = 'transparent'}
                        onClick={() => { setShowProfileMenu(false); setShowProfileModal(true); }}
                      >
                        <span style={{ fontSize: 16 }}>👤</span> {t('profile') || 'Mi Perfil'}
                      </button>
                      
                      <button 
                        style={{ 
                          width: '100%', textAlign: 'left', padding: '10px 16px', 
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: '#EF4444', display: 'flex', alignItems: 'center', gap: 12
                        }}
                        onMouseEnter={e => e.target.style.background = 'var(--color-bg)'}
                        onMouseLeave={e => e.target.style.background = 'transparent'}
                        onClick={() => { setShowProfileMenu(false); cerrarSesion(); }}
                      >
                        <span style={{ fontSize: 16 }}>🚪</span> {t('logout') || 'Cerrar sesión'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        {renderView()}
      </div>

      {/* Profile Modal */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />

      {/* Toast notification */}
      {toast && (
        <div className="toast" style={{ zIndex: 99999 }}>
          {toast.type === 'success' && '✅ '}
          {toast.type === 'error' && '❌ '}
          {toast.type === 'info' && 'ℹ️ '}
          {toast.message}
        </div>
      )}
    </div>
  );
}
