import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import useAppStore from './appStore';

describe('appStore', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.setAttribute('data-theme', 'light');
    useAppStore.setState({
      language: 'es',
      theme: 'light',
      user: null,
      currentView: 'dashboard',
      openTabs: [],
      activeTabId: null,
      activeTool: null,
      activeColor: '#DDD6FE',
      rightPanelOpen: true,
      showStickyNotes: true,
      annotations: [],
      dirHandles: [],
      toast: null,
    });
  });

  afterEach(() => {
    // reset any stateful updates
    useAppStore.setState({
      language: 'es',
      theme: 'light',
      openTabs: [],
      activeTabId: null,
    });
    localStorage.clear();
  });

  it('setLanguage updates state and localStorage', () => {
    useAppStore.getState().setLanguage('en');

    expect(useAppStore.getState().language).toBe('en');
    expect(localStorage.getItem('lfph-lang')).toBe('en');
  });

  it('toggleLanguage switches between en and es', () => {
    useAppStore.setState({ language: 'es' });
    useAppStore.getState().toggleLanguage();
    expect(useAppStore.getState().language).toBe('en');

    useAppStore.getState().toggleLanguage();
    expect(useAppStore.getState().language).toBe('es');
  });

  it('setTheme updates state, localStorage, and document attribute', () => {
    useAppStore.getState().setTheme('dark');
    expect(useAppStore.getState().theme).toBe('dark');
    expect(localStorage.getItem('lfph-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggleTheme toggles the theme', () => {
    useAppStore.setState({ theme: 'light' });
    useAppStore.getState().toggleTheme();
    expect(useAppStore.getState().theme).toBe('dark');
    useAppStore.getState().toggleTheme();
    expect(useAppStore.getState().theme).toBe('light');
  });
});
