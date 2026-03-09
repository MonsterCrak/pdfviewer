import React, { useEffect } from 'react';
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

export default function App() {
  const currentView = useAppStore(s => s.currentView);
  const toast = useAppStore(s => s.toast);
  const loadCollections = useAppStore(s => s.loadCollections);
  const theme = useAppStore(s => s.theme);
  const { t } = useTranslation();

  // Initialize theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--color-primary-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 600, fontSize: 13
              }}>
                U
              </div>
            </div>
          </div>
        )}
        {renderView()}
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="toast">
          {toast.type === 'success' && '✅ '}
          {toast.type === 'error' && '❌ '}
          {toast.type === 'info' && 'ℹ️ '}
          {toast.message}
        </div>
      )}
    </div>
  );
}
