import React, { useEffect, useState } from 'react';
import useAppStore from '../stores/appStore';
import useTranslation from '../hooks/useTranslation';
import PdfCard from '../components/PdfCard';
import { readFileAsArrayBuffer } from '../services/fileSystemService';
import { loadPdfDocument } from '../services/pdfService';

const COLLECTION_COLORS = [
  { name: 'Violet', value: '#818CF8' },
  { name: 'Pink', value: '#F472B6' },
  { name: 'Teal', value: '#34D399' },
  { name: 'Yellow', value: '#FBBF24' },
  { name: 'Blue', value: '#60A5FA' },
  { name: 'Orange', value: '#FB923C' },
];

export default function Collections() {
  const files = useAppStore(s => s.files);
  const collections = useAppStore(s => s.collections);
  const loadCollections = useAppStore(s => s.loadCollections);
  const loadFiles = useAppStore(s => s.loadFiles);
  const addCollection = useAppStore(s => s.addCollection);
  const removeCollection = useAppStore(s => s.removeCollection);
  const updateFile = useAppStore(s => s.updateFile);
  const openFileInViewer = useAppStore(s => s.openFileInViewer);
  const showToast = useAppStore(s => s.showToast);
  const activeCollectionId = useAppStore(s => s.activeCollectionId);
  const setActiveCollection = useAppStore(s => s.setActiveCollection);

  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLLECTION_COLORS[0].value);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const { t } = useTranslation();

  useEffect(() => {
    loadCollections();
    loadFiles();
  }, [loadCollections, loadFiles]);

  const handleCreateCollection = () => {
    if (!newName.trim()) return;
    addCollection({
      id: `col-${Date.now()}`,
      name: newName.trim(),
      color: newColor,
      createdAt: Date.now(),
    });
    setNewName('');
    setShowModal(false);
    showToast(t('collectionCreated'), 'success');
  };

  const handleDeleteCollection = (colId) => {
    if (window.confirm(t('deleteConfirm'))) {
      removeCollection(colId);
      showToast(t('collectionDeleted'), 'info');
    }
  };

  const filteredFiles = activeCollectionId === null
    ? files
    : activeCollectionId === 'uncategorized'
      ? files.filter(f => !f.collectionId)
      : files.filter(f => f.collectionId === activeCollectionId);

  const handleOpenFile = async (file) => {
    try {
      let handle = file._handle;
      if (!handle) {
        const [fileHandle] = await window.showOpenFilePicker({
          types: [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }],
        });
        handle = fileHandle;
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
    } catch (e) {
      if (e.name !== 'AbortError') {
        showToast(t('errorOpenFile'), 'error');
      }
    }
  };

  const handleAssignToCollection = async (collectionId) => {
    for (const fileId of selectedFiles) {
      const file = files.find(f => f.id === fileId);
      if (file) {
        await updateFile({ ...file, collectionId });
      }
    }
    setSelectedFiles(new Set());
    showToast(t('movedFiles', selectedFiles.size), 'success');
  };

  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  const handleDrop = (e, collectionId) => {
    e.preventDefault();
    const fileId = e.dataTransfer.getData('text/plain');
    if (fileId) {
      const file = files.find(f => f.id === fileId);
      if (file) {
        updateFile({ ...file, collectionId });
        showToast(t('movedToCollection'), 'success');
      }
    }
  };

  const handleDragStart = (e, fileId) => {
    e.dataTransfer.setData('text/plain', fileId);
  };

  return (
    <div className="app-content" style={{ display: 'flex', gap: 'var(--space-lg)', height: '100%', overflow: 'hidden' }}>
      {/* Left: Collections list */}
      <div className="collections-list">
        <h2 className="section-title" style={{ marginBottom: 'var(--space-md)' }}>{t('collections')}</h2>

        <button
          className={`collection-item ${activeCollectionId === null ? 'active' : ''}`}
          onClick={() => setActiveCollection(null)}
        >
          <span className="collection-dot" style={{ background: 'var(--color-primary)' }} />
          {t('allDocuments')}
          <span className="collection-count">{files.length}</span>
        </button>

        <button
          className={`collection-item ${activeCollectionId === 'uncategorized' ? 'active' : ''}`}
          onClick={() => setActiveCollection('uncategorized')}
        >
          <span className="collection-dot" style={{ background: 'var(--color-text-muted)' }} />
          {t('uncategorized')}
          <span className="collection-count">{files.filter(f => !f.collectionId).length}</span>
        </button>

        {collections.map(col => (
          <button
            key={col.id}
            className={`collection-item ${activeCollectionId === col.id ? 'active' : ''}`}
            onClick={() => setActiveCollection(col.id)}
            onDrop={(e) => handleDrop(e, col.id)}
            onDragOver={(e) => e.preventDefault()}
          >
            <span className="collection-dot" style={{ background: col.color }} />
            {col.name}
            <span className="collection-count">{files.filter(f => f.collectionId === col.id).length}</span>
          </button>
        ))}

        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
          style={{ marginTop: 'var(--space-md)', width: '100%', justifyContent: 'center' }}
        >
          {t('createNew')}
        </button>

        {activeCollectionId && activeCollectionId !== 'uncategorized' && (
          <button
            className="btn btn-ghost"
            onClick={() => handleDeleteCollection(activeCollectionId)}
            style={{ width: '100%', justifyContent: 'center', color: 'var(--color-danger)', marginTop: 'var(--space-sm)' }}
          >
            🗑️ {t('deleteCollection')}
          </button>
        )}
      </div>

      {/* Right: Files grid */}
      <div className="collections-grid" style={{ flex: 1, overflowY: 'auto' }}>
        <div className="section-header">
          <h2 className="section-title">{activeCollectionId === null ? t('allDocuments') : activeCollectionId === 'uncategorized' ? t('uncategorized') : collections.find(c => c.id === activeCollectionId)?.name || t('collections')}</h2>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {filteredFiles.length} documents
          </span>
        </div>

        {filteredFiles.length > 0 ? (
          <div className="grid-docs">
            {filteredFiles.map(file => (
              <div
                key={file.id}
                draggable
                onDragStart={(e) => handleDragStart(e, file.id)}
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    toggleFileSelection(file.id);
                  }
                }}
                style={{
                  border: selectedFiles.has(file.id) ? '2px solid var(--color-primary)' : '2px solid transparent',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <PdfCard file={file} onClick={() => handleOpenFile(file)} />
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
            <h3>{t('noDocsInCollection')}</h3>
            <p>{t('dragDocsHere')}</p>
          </div>
        )}

        {/* Multi-select action bar */}
        {selectedFiles.size > 0 && (
          <div style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)', padding: '12px 24px',
            boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: 16, zIndex: 100,
          }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{t('selected', selectedFiles.size)}</span>
            <div className="toolbar-divider" />
            {collections.map(col => (
              <button
                key={col.id}
                className="btn btn-secondary"
                onClick={() => handleAssignToCollection(col.id)}
                style={{ fontSize: 12, padding: '4px 12px' }}
              >
                <span className="collection-dot" style={{ background: col.color, width: 8, height: 8 }} />
                {col.name}
              </button>
            ))}
            <button className="btn btn-ghost" onClick={() => setSelectedFiles(new Set())} style={{ fontSize: 12 }}>
              {t('cancel')}
            </button>
          </div>
        )}
      </div>

      {/* Create collection modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{t('createCollection')}</h2>
            <input
              type="text"
              placeholder={t('collectionName')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateCollection(); }}
            />
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {COLLECTION_COLORS.map(c => (
                <div
                  key={c.value}
                  className={`color-dot ${newColor === c.value ? 'active' : ''}`}
                  style={{ background: c.value, width: 28, height: 28 }}
                  onClick={() => setNewColor(c.value)}
                />
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('cancel')}</button>
              <button className="btn btn-primary" onClick={handleCreateCollection}>{t('create')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
