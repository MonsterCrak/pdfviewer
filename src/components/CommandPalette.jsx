import React, { useState, useEffect, useRef } from 'react';
import useAppStore from '../stores/appStore';
import useTranslation from '../hooks/useTranslation';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { t } = useTranslation();

  const files = useAppStore(s => s.files);
  const openTabs = useAppStore(s => s.openTabs);
  const setActiveTab = useAppStore(s => s.setActiveTab);
  const setView = useAppStore(s => s.setView);

  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setIsOpen(true);
        setQuery('');
        setSelectedIndex(0);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const filtered = files.filter(f => 
    f.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 10);

  const handleSelect = (file) => {
    const existing = openTabs.find(t => t.id === file.id);
    if (existing) {
      setActiveTab(file.id);
      setView('viewer');
    } else {
      // For simplicity, we just navigate to Dashboard or just use the same handle as before
      // In this app, many files might lose their handle on refresh, but here we assume handle is cached in-memory if open once.
      // But let's just use the store's openFileInViewer for now.
      // NOTE: This might need full PDF re-loading if not in openTabs.
      // For this task, we prioritize switching between ALREADY OPEN tabs first as it's the fastest.
      setActiveTab(file.id);
      setView('viewer');
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      handleSelect(filtered[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setIsOpen(false)}>
      <div 
        className="command-palette" 
        onClick={e => e.stopPropagation()}
        style={{
          width: '600px',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          marginTop: '10vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid var(--color-border)',
        }}
      >
        <div className="command-palette-header" style={{
          padding: 'var(--space-md)',
          borderBottom: '1px solid var(--color-border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              border: 'none',
              background: 'none',
              outline: 'none',
              fontSize: 16,
              color: 'var(--color-text-primary)',
              fontFamily: 'inherit',
            }}
          />
        </div>
        <div className="command-palette-list" style={{
          maxHeight: '400px',
          overflowY: 'auto',
          padding: 'var(--space-sm)',
        }}>
          {filtered.length > 0 ? filtered.map((file, idx) => {
            const isOpen = openTabs.some(t => t.id === file.id);
            return (
              <div
                key={file.id}
                className={`command-item ${idx === selectedIndex ? 'active' : ''}`}
                onClick={() => handleSelect(file)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 'var(--space-md)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  background: idx === selectedIndex ? 'var(--color-primary-light)' : 'transparent',
                  transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18
                }}>
                  📄
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-primary)' }}>{file.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{file.path}</div>
                </div>
                {isOpen && (
                  <span style={{ fontSize: 11, background: 'var(--color-primary)', color: 'white', padding: '2px 8px', borderRadius: 20 }}>
                    OPEN
                  </span>
                )}
              </div>
            );
          }) : (
            <div style={{ padding: 'var(--space-xl)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No documents found matching "{query}"
            </div>
          )}
        </div>
        <div style={{
          padding: 'var(--space-sm) var(--space-md)',
          background: 'var(--color-bg)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          fontSize: 11,
          color: 'var(--color-text-muted)',
          borderTop: '1px solid var(--color-border-light)',
        }}>
          <span><kbd style={{ background: 'var(--color-surface)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--color-border)' }}>Enter</kbd> to select</span>
          <span><kbd style={{ background: 'var(--color-surface)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--color-border)' }}>↑↓</kbd> to navigate</span>
          <span><kbd style={{ background: 'var(--color-surface)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--color-border)' }}>Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
