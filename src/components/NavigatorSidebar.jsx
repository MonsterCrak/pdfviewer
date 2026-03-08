import React, { useEffect, useRef, useState } from 'react';
import useAppStore from '../stores/appStore';
import useTranslation from '../hooks/useTranslation';
import { renderThumbnail } from '../services/pdfService';
import { readFileAsArrayBuffer, pickSinglePdfFallback, isFileSystemSupported } from '../services/fileSystemService';
import { loadPdfDocument } from '../services/pdfService';

export default function NavigatorSidebar() {
  const openTabs = useAppStore(s => s.openTabs);
  const activeTabId = useAppStore(s => s.activeTabId);
  const setActiveTab = useAppStore(s => s.setActiveTab);
  const closeTab = useAppStore(s => s.closeTab);
  const files = useAppStore(s => s.files);
  const openFileInViewer = useAppStore(s => s.openFileInViewer);
  const showToast = useAppStore(s => s.showToast);
  const { t } = useTranslation();

  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleOpenLocalFile = async (file) => {
    try {
      let handle = file._handle;
      if (!handle) {
        if (isFileSystemSupported()) {
          const [fileHandle] = await window.showOpenFilePicker({
            types: [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }],
          });
          handle = fileHandle;
        } else {
          handle = await pickSinglePdfFallback();
        }
      }

      const buffer = await readFileAsArrayBuffer(handle);
      const pdfDoc = await loadPdfDocument(buffer);

      openFileInViewer({
        id: file.id,
        name: file.name,
        fileHandle: handle,
        pdfDoc,
        arrayBuffer: buffer,
        currentPage: 1,
        totalPages: pdfDoc.numPages,
      });
      setShowAddMenu(false);
    } catch (e) {
      if (e.name !== 'AbortError') {
        showToast(t('errorOpeningFile') + e.message, 'error');
      }
    }
  };

  return (
    <div className="navigator-sidebar">
      <div className="navigator-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="navigator-title">{t('openDocuments')}</span>
          <span className="badge">{openTabs.length}</span>
        </div>
        <button 
          className="tool-btn" 
          onClick={() => setShowAddMenu(!showAddMenu)}
          style={{ width: 28, height: 28, borderRadius: '50%', background: showAddMenu ? 'var(--color-primary)' : 'var(--color-bg)', color: showAddMenu ? 'white' : 'inherit' }}
        >
          {showAddMenu ? '×' : '+'}
        </button>
      </div>

      {showAddMenu && (
        <div className="navigator-add-menu" style={{ 
          padding: 'var(--space-sm)', 
          borderBottom: '1px solid var(--color-border-light)',
          background: 'var(--color-primary-lighter)',
          maxHeight: 300,
          overflowY: 'auto'
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 8, textTransform: 'uppercase' }}>
            {t('recentDocuments')}
          </div>
          {files.slice(0, 8).map(file => (
            <div 
              key={file.id} 
              className="navigator-add-item" 
              onClick={() => handleOpenLocalFile(file)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
                transition: 'background 0.2s'
              }}
            >
              <span style={{ fontSize: 14 }}>📄</span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
            </div>
          ))}
          {files.length === 0 && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center', padding: 8 }}>No files in library</div>}
        </div>
      )}

      <div className="navigator-list">
        {openTabs.map(tab => (
          <NavigatorItem
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onSelect={() => setActiveTab(tab.id)}
            onClose={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function NavigatorItem({ tab, isActive, onSelect, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && tab.pdfDoc) {
      // Increase res to 120 and let CSS scale down for sharpness
      renderThumbnail(tab.pdfDoc, tab.currentPage || 1, canvasRef.current, 120).catch(() => {});
    }
  }, [tab.pdfDoc, tab.currentPage]);

  return (
    <div 
      className={`navigator-item ${isActive ? 'active' : ''}`}
      onClick={onSelect}
      title={tab.name}
    >
      <div className="navigator-item-thumb">
        <canvas ref={canvasRef} />
      </div>
      <div className="navigator-item-info">
        <div className="navigator-item-name">{tab.name}</div>
        <div className="navigator-item-meta">
          {tab.currentPage || 1} / {tab.totalPages || '?'}
        </div>
      </div>
      <button className="navigator-item-close" onClick={onClose}>×</button>
    </div>
  );
}
