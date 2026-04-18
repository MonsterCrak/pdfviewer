import React, { useState, useEffect, useCallback } from 'react';
import useAppStore from '../stores/appStore';
import useTranslation from '../hooks/useTranslation';
import PdfCard from '../components/PdfCard';
import { pickDirectory, scanForPdfs, readFileAsArrayBuffer, isFileSystemSupported, pickDirectoryFallback, pickSinglePdfFallback } from '../services/fileSystemService';
import { loadPdfDocument, getThumbnail } from '../services/pdfService';

export default function Dashboard() {
  const files = useAppStore(s => s.files);
  const loadFiles = useAppStore(s => s.loadFiles);
  const addFile = useAppStore(s => s.addFile);
  const openFileInViewer = useAppStore(s => s.openFileInViewer);
  const showToast = useAppStore(s => s.showToast);
  const searchQuery = useAppStore(s => s.searchQuery);
  const collections = useAppStore(s => s.collections);
  const [isScanning, setIsScanning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper: process a single file (handle or File obj) and add to store
  const processAndAddFile = async (fileObj, name, path, dirKey) => {
    const existingFiles = useAppStore.getState().files;
    const exists = existingFiles.find(f => f.name === name && f.path === path);
    if (exists) return;

    let thumbnail = null;
    let totalPages = 0;
    try {
      const buffer = await readFileAsArrayBuffer(fileObj);
      const doc = await loadPdfDocument(buffer);
      thumbnail = await getThumbnail(doc, 1, 0.3);
      totalPages = doc.numPages;
    } catch (e) {
      console.warn('Could not process', name, e);
    }

    const fileEntry = {
      id: `${dirKey}/${path}`,
      name,
      path,
      dirHandleKey: dirKey,
      thumbnail,
      totalPages,
      lastOpened: null,
      readProgress: 0,
      collectionId: null,
      tags: [],
    };
    fileEntry._handle = fileObj;
    await addFile(fileEntry);
  };

  const handleConnectFolder = async () => {
    try {
      setIsScanning(true);

      if (isFileSystemSupported()) {
        // Native File System Access API (Chrome / Edge)
        const dirHandle = await pickDirectory();
        const pdfFiles = await scanForPdfs(dirHandle);
        showToast(t('foundFiles', pdfFiles.length), 'success');
        for (const pdfFile of pdfFiles) {
          await processAndAddFile(pdfFile.handle, pdfFile.name, pdfFile.path, pdfFile.dirHandleKey);
        }
      } else {
        // Fallback: <input type="file" webkitdirectory> (Brave / Firefox)
        const pdfFiles = await pickDirectoryFallback();
        showToast(t('foundFiles', pdfFiles.length), 'success');
        for (const file of pdfFiles) {
          const relativePath = file.webkitRelativePath || file.name;
          await processAndAddFile(file, file.name, relativePath, 'local');
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        showToast(t('errorAccessingFolder') + e.message, 'error');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleOpenFile = async (file) => {
    try {
      let handle = file._handle;
      if (!handle) {
        // Fallback: open via input if native API not available
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

      await useAppStore.getState().updateFile({
        ...file,
        lastOpened: Date.now(),
      });

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
        showToast(t('errorOpeningFile') + e.message, 'error');
      }
    }
  };

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setDragOver(false);
    const items = e.dataTransfer.items;
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file.name.toLowerCase().endsWith('.pdf')) {
          try {
            const buffer = await file.arrayBuffer();
            const doc = await loadPdfDocument(buffer);
            const thumbnail = await getThumbnail(doc, 1, 0.3);

            const fileEntry = {
              id: `drop/${file.name}/${Date.now()}`,
              name: file.name,
              path: file.name,
              dirHandleKey: 'drop',
              thumbnail,
              totalPages: doc.numPages,
              lastOpened: Date.now(),
              readProgress: 0,
              collectionId: null,
              tags: [],
            };
            await addFile(fileEntry);

            openFileInViewer({
              id: fileEntry.id,
              name: file.name,
              pdfDoc: doc,
              arrayBuffer: buffer,
              currentPage: 1,
              totalPages: doc.numPages,
            });
          } catch {
            showToast(t('errorLoadingDropped'), 'error');
          }
        }
      }
    }
  }, [addFile, openFileInViewer, showToast, t]);

  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const recentFiles = filteredFiles.slice(0, 12);

  return (
    <div className="app-content">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <h1>{t('welcomeTitle')}</h1>
        <p>{t('welcomeSubtitle')}</p>
        <button className="btn-banner" onClick={handleConnectFolder} disabled={isScanning}>
          {isScanning ? t('scanning') : t('connectFolder')}
        </button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: '#EDE9FE', color: '#7C3AED' }}>📄</div>
          <div className="stat-card-value">{files.length}</div>
          <div className="stat-card-label">{t('totalDocuments')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: '#D1FAE5', color: '#10B981' }}>📋</div>
          <div className="stat-card-value">{collections.length}</div>
          <div className="stat-card-label">{t('collectionsLabel')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: '#DBEAFE', color: '#3B82F6' }}>🕐</div>
          <div className="stat-card-value">{files.filter(f => f.lastOpened).length}</div>
          <div className="stat-card-label">{t('recentlyOpened')}</div>
        </div>
      </div>

      {/* Drag & drop zone */}
      <div
        className={`drop-zone ${dragOver ? 'dragover' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={handleConnectFolder}
      >
        <div style={{ fontSize: 32 }}>📥</div>
        <p><strong>{t('dragDropTitle')}</strong> {t('dragDropSubtitle')}</p>
      </div>

      {/* Recent Documents */}
      <div className="section-header">
        <h2 className="section-title">{t('recentDocuments')}</h2>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          {filteredFiles.length} {t('documents')}
        </span>
      </div>

      {recentFiles.length > 0 ? (
        <div className="grid-docs">
          {recentFiles.map(file => (
            <PdfCard key={file.id} file={file} onClick={handleOpenFile} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 16 }}>📁</div>
          <h3>{t('noDocumentsYet')}</h3>
          <p>{t('noDocumentsDesc')}</p>
        </div>
      )}
    </div>
  );
}
