import React from 'react';
import useAppStore from '../stores/appStore';
import useTranslation from '../hooks/useTranslation';

const navItems = [
  { id: 'dashboard', icon: '🏠', labelKey: 'dashboard' },
  { id: 'viewer', icon: '📄', labelKey: 'viewer' },
  { id: 'comparison', icon: '🔀', labelKey: 'compare' },
  { id: 'collections', icon: '📁', labelKey: 'collections' },
];

export default function Sidebar() {
  const currentView = useAppStore(s => s.currentView);
  const setView = useAppStore(s => s.setView);
  const theme = useAppStore(s => s.theme);
  const toggleTheme = useAppStore(s => s.toggleTheme);
  const toggleLanguage = useAppStore(s => s.toggleLanguage);
  const language = useAppStore(s => s.language);
  const { t } = useTranslation();

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">PDF</div>
      <div className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`sidebar-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => setView(item.id)}
            title={t(item.labelKey)}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
          </button>
        ))}
      </div>
      <div className="sidebar-bottom">
        {/* Language toggle */}
        <button
          className="sidebar-item"
          title={t('language')}
          onClick={toggleLanguage}
        >
          <span style={{ fontSize: 13, fontWeight: 600 }}>{language === 'en' ? 'EN' : 'ES'}</span>
        </button>

        {/* Theme toggle */}
        <button
          className="sidebar-item"
          title={t('theme')}
          onClick={toggleTheme}
        >
          <span style={{ fontSize: 20 }}>{theme === 'light' ? '🌙' : '☀️'}</span>
        </button>

        <button className="sidebar-item" title={t('settings')}>
          <span style={{ fontSize: 20 }}>⚙️</span>
        </button>
      </div>
    </nav>
  );
}
