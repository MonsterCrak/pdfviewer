import React, { useState, useRef, useEffect } from 'react';
import useTranslation from '../hooks/useTranslation';
import { pickSinglePdf, readFileAsArrayBuffer, isFileSystemSupported, pickSinglePdfFallback } from '../services/fileSystemService';
import { loadPdfDocument, renderPage, getTextContent } from '../services/pdfService';

function diffText(textA, textB) {
  const wordsA = textA.split(/\s+/);
  const wordsB = textB.split(/\s+/);
  const result = { added: [], removed: [] };
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);

  wordsB.forEach((word) => {
    if (!setA.has(word)) result.added.push(word);
  });
  wordsA.forEach((word) => {
    if (!setB.has(word)) result.removed.push(word);
  });
  return result;
}

function ComparisonPane({ label, onDocLoaded, pdfDoc, paneRef, currentPage, setCurrentPage, diffWords, diffType }) {
  const canvasRef = useRef(null);
  const [scale] = useState(1.0);
  const { t } = useTranslation();

  useEffect(() => {
    if (pdfDoc && canvasRef.current) {
      renderPage(pdfDoc, currentPage, canvasRef.current, scale);
    }
  }, [pdfDoc, currentPage, scale]);

  const handleSelectFile = async () => {
    try {
      let buffer;
      let fileName;

      if (isFileSystemSupported()) {
        const handle = await pickSinglePdf();
        buffer = await readFileAsArrayBuffer(handle);
        const file = await handle.getFile();
        fileName = file.name;
      } else {
        const file = await pickSinglePdfFallback();
        buffer = await file.arrayBuffer();
        fileName = file.name;
      }

      const doc = await loadPdfDocument(buffer);
      onDocLoaded({ doc, buffer, name: fileName });
    } catch (e) {
      if (e.name !== 'AbortError') console.error(e);
    }
  };

  return (
    <div className="comparison-pane">
      <div className="comparison-pane-header">
        <span className="comparison-pane-title">
          {pdfDoc ? label : 'No document'}
        </span>
        <button className="btn btn-secondary" onClick={handleSelectFile} style={{ fontSize: 12, padding: '4px 12px' }}>
          📂 {pdfDoc ? t('change') : t('selectPdf')}
        </button>
      </div>
      <div className="comparison-pane-content" ref={paneRef}>
        {pdfDoc ? (
          <div style={{ position: 'relative' }}>
            <div className="pdf-page-container">
              <canvas ref={canvasRef} />
            </div>
            {/* Text diff overlay */}
            {diffWords && diffWords.length > 0 && (
              <div style={{
                marginTop: 8,
                padding: 8,
                background: diffType === 'added' ? 'var(--color-diff-add)' : 'var(--color-diff-remove)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                maxHeight: 100,
                overflow: 'auto',
              }}>
                <strong>{diffType === 'added' ? t('newWords') : t('removedWords')}</strong>{' '}
                {diffWords.slice(0, 30).join(', ')}
                {diffWords.length > 30 && ` ${t('andMore', diffWords.length - 30)}`}
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: 8 }}>📄</div>
            <p>{t('selectPdfCompare')}</p>
          </div>
        )}
      </div>
      {pdfDoc && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, padding: 8, borderTop: '1px solid var(--color-border-light)',
        }}>
          <button className="tool-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>◀</button>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {currentPage} / {pdfDoc.numPages}
          </span>
          <button className="tool-btn" onClick={() => setCurrentPage(p => Math.min(pdfDoc.numPages, p + 1))}>▶</button>
        </div>
      )}
    </div>
  );
}

export default function Comparison() {
  const [leftDoc, setLeftDoc] = useState(null);
  const [rightDoc, setRightDoc] = useState(null);
  const [leftPage, setLeftPage] = useState(1);
  const [rightPage, setRightPage] = useState(1);
  const [syncScroll, setSyncScroll] = useState(false);
  const [diffResult, setDiffResult] = useState(null);
  const [diffMode, setDiffMode] = useState(false);
  const leftPaneRef = useRef(null);
  const rightPaneRef = useRef(null);

  // Sync scroll
  useEffect(() => {
    if (!syncScroll) return;
    const left = leftPaneRef.current;
    const right = rightPaneRef.current;
    if (!left || !right) return;

    let syncing = false;
    const handleLeftScroll = () => {
      if (syncing) return;
      syncing = true;
      right.scrollTop = left.scrollTop;
      syncing = false;
    };
    const handleRightScroll = () => {
      if (syncing) return;
      syncing = true;
      left.scrollTop = right.scrollTop;
      syncing = false;
    };

    left.addEventListener('scroll', handleLeftScroll);
    right.addEventListener('scroll', handleRightScroll);
    return () => {
      left.removeEventListener('scroll', handleLeftScroll);
      right.removeEventListener('scroll', handleRightScroll);
    };
  }, [syncScroll]);

  // Sync page numbers
  useEffect(() => {
    if (syncScroll) {
      setRightPage(leftPage);
    }
  }, [leftPage, syncScroll]);

  // Compute diff
  useEffect(() => {
    if (!diffMode || !leftDoc?.doc || !rightDoc?.doc) {
      setDiffResult(null);
      return;
    }
    const compute = async () => {
      const leftText = await getTextContent(leftDoc.doc, leftPage);
      const rightText = await getTextContent(rightDoc.doc, rightPage);
      const result = diffText(leftText, rightText);
      setDiffResult(result);
    };
    compute();
  }, [diffMode, leftDoc, rightDoc, leftPage, rightPage]);

  return (
    <div className="comparison-layout" style={{ height: '100%' }}>
      <div className="comparison-controls">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Sync Scroll</span>
          <button
            className={`toggle ${syncScroll ? 'active' : ''}`}
            onClick={() => setSyncScroll(!syncScroll)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Diff Mode</span>
          <button
            className={`toggle ${diffMode ? 'active' : ''}`}
            onClick={() => setDiffMode(!diffMode)}
          />
        </div>
      </div>
      <div className="comparison-panes">
        <ComparisonPane
          label={leftDoc?.name || 'Document A'}
          pdfDoc={leftDoc?.doc}
          onDocLoaded={setLeftDoc}
          paneRef={leftPaneRef}
          currentPage={leftPage}
          setCurrentPage={setLeftPage}
          diffWords={diffResult?.removed}
          diffType="removed"
        />
        <ComparisonPane
          label={rightDoc?.name || 'Document B'}
          pdfDoc={rightDoc?.doc}
          onDocLoaded={setRightDoc}
          paneRef={rightPaneRef}
          currentPage={rightPage}
          setCurrentPage={setRightPage}
          diffWords={diffResult?.added}
          diffType="added"
        />
      </div>
    </div>
  );
}
