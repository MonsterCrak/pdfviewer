import { create } from 'zustand';
import * as db from '../services/indexedDBService';

const useAppStore = create((set, get) => ({
  // --- Language & Theme ---
  language: localStorage.getItem('lfph-lang') || 'es',
  theme: localStorage.getItem('lfph-theme') || 'light',
  setLanguage: (lang) => {
    localStorage.setItem('lfph-lang', lang);
    set({ language: lang });
  },
  toggleLanguage: () => {
    const next = get().language === 'en' ? 'es' : 'en';
    localStorage.setItem('lfph-lang', next);
    set({ language: next });
  },
  setTheme: (theme) => {
    localStorage.setItem('lfph-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('lfph-theme', next);
    document.documentElement.setAttribute('data-theme', next);
    set({ theme: next });
  },

  // --- Navigation ---
  currentView: 'dashboard', // dashboard | viewer | comparison | collections
  setView: (view) => set({ currentView: view }),

  // --- Files ---
  files: [],
  loadFiles: async () => {
    const files = await db.getAllFiles();
    set({ files });
  },
  addFile: async (file) => {
    await db.putFile(file);
    await get().loadFiles();
  },
  updateFile: async (file) => {
    await db.putFile(file);
    await get().loadFiles();
  },
  removeFile: async (id) => {
    await db.deleteFile(id);
    await get().loadFiles();
  },

  // --- Collections ---
  collections: [],
  activeCollectionId: null,
  loadCollections: async () => {
    const collections = await db.getAllCollections();
    set({ collections });
  },
  addCollection: async (collection) => {
    await db.putCollection(collection);
    await get().loadCollections();
  },
  updateCollection: async (collection) => {
    await db.putCollection(collection);
    await get().loadCollections();
  },
  removeCollection: async (id) => {
    await db.deleteCollection(id);
    await get().loadCollections();
    if (get().activeCollectionId === id) {
      set({ activeCollectionId: null });
    }
  },
  setActiveCollection: (id) => set({ activeCollectionId: id }),

  // --- Viewer ---
  openTabs: JSON.parse(localStorage.getItem('lfph-opentabs') || '[]'),
  activeTabId: localStorage.getItem('lfph-activetab') || null,
  activeTool: null,       // 'highlight' | 'sticky' | 'draw' | null
  activeColor: '#DDD6FE', // lilac default
  rightPanelOpen: true,
  showStickyNotes: true,
  annotations: [],        // annotations for current file

  openFileInViewer: (tab) => {
    const tabs = get().openTabs;
    const existing = tabs.find(t => t.id === tab.id);
    let newTabs, newActiveId;
    if (existing) {
      newTabs = tabs.map(t => t.id === tab.id ? { ...t, ...tab, currentPage: 1 } : t);
      newActiveId = tab.id;
    } else {
      newTabs = [...tabs, { ...tab, currentPage: 1 }];
      newActiveId = tab.id;
    }
    set({ openTabs: newTabs, activeTabId: newActiveId, currentView: 'viewer' });
    const minTabs = newTabs.map(t => ({ id: t.id, name: t.name, currentPage: t.currentPage, totalPages: t.totalPages }));
    localStorage.setItem('lfph-opentabs', JSON.stringify(minTabs));
    localStorage.setItem('lfph-activetab', newActiveId);
  },
  closeTab: (tabId) => {
    const tabs = get().openTabs.filter(t => t.id !== tabId);
    const activeId = get().activeTabId === tabId
      ? (tabs.length > 0 ? tabs[tabs.length - 1].id : null)
      : get().activeTabId;
    set({ openTabs: tabs, activeTabId: activeId });
    if (tabs.length === 0) set({ currentView: 'dashboard' });
    
    const minTabs = tabs.map(t => ({ id: t.id, name: t.name, currentPage: t.currentPage, totalPages: t.totalPages }));
    localStorage.setItem('lfph-opentabs', JSON.stringify(minTabs));
    localStorage.setItem('lfph-activetab', activeId || '');
  },
  setActiveTab: (tabId) => {
    set({ activeTabId: tabId });
    localStorage.setItem('lfph-activetab', tabId);
  },
  updateTab: (tabId, updates) => {
    const newTabs = get().openTabs.map(t => t.id === tabId ? { ...t, ...updates } : t);
    set({ openTabs: newTabs });
    const minTabs = newTabs.map(t => ({ id: t.id, name: t.name, currentPage: t.currentPage, totalPages: t.totalPages }));
    localStorage.setItem('lfph-opentabs', JSON.stringify(minTabs));
  },

  setActiveTool: (tool) => set({ activeTool: get().activeTool === tool ? null : tool }),
  setActiveColor: (color) => set({ activeColor: color }),
  toggleRightPanel: () => set({ rightPanelOpen: !get().rightPanelOpen }),
  toggleStickyNotes: () => set({ showStickyNotes: !get().showStickyNotes }),

  loadAnnotations: async (fileId) => {
    const annotations = await db.getAnnotationsByFile(fileId);
    set({ annotations });
  },
  addAnnotation: async (annotation) => {
    await db.putAnnotation(annotation);
    await get().loadAnnotations(annotation.fileId);
  },
  removeAnnotation: async (id, fileId) => {
    await db.deleteAnnotation(id);
    await get().loadAnnotations(fileId);
  },

  // --- Search ---
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // --- Toast ---
  toast: null,
  showToast: (message, type = 'info') => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 3000);
  },

  // --- Directory handles (in memory) ---
  dirHandles: [],
  setDirHandles: (handles) => set({ dirHandles: handles }),
}));

export default useAppStore;
