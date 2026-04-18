import React, { useState, useRef, useEffect, useCallback } from 'react';
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

/**
 * Compare all pages between two documents
 * Returns: { removed: { pageNum: [words] }, added: { pageNum: [words] }, pagesWithDiffs: [pageNums] }
 */
async function computeFullDiff(leftDoc, rightDoc) {
  const result = {
    removed: {},
    added: {},
    pagesWithDiffs: []
  };

  if (!leftDoc?.doc || !rightDoc?.doc) return result;

  const maxPages = Math.max(leftDoc.doc.numPages, rightDoc.doc.numPages);

  for (let page = 1; page <= maxPages; page++) {
    const leftText = await getTextContent(leftDoc.doc, page).catch(() => '');
    const rightText = await getTextContent(rightDoc.doc, page).catch(() => '');
    const diff = diffText(leftText, rightText);

    if (diff.removed.length > 0 || diff.added.length > 0) {
      result.removed[page] = diff.removed;
      result.added[page] = diff.added;
      result.pagesWithDiffs.push(page);
    }
  }

  return result;
}

const ComparisonPage = React.forwardRef(({ pdfDoc, pageNum, scale }, ref) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isRendered, setIsRendered] = useState(false);
  const [canvasDim, setCanvasDim] = useState({ w: 0, h: 0 });

  const render = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;
    try {
      const dim = await renderPage(pdfDoc, pageNum, canvasRef.current, scale);
      setCanvasDim({ w: dim.width, h: dim.height });
      setIsRendered(true);
    } catch (e) { console.error("Comparison page render error", pageNum, e); }
  }, [pdfDoc, pageNum, scale]);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !isRendered) render();
    }, { threshold: 0.01, rootMargin: '600px' });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [render, isRendered]);

  useEffect(() => {
    if (isRendered) render();
  }, [scale, render, isRendered]);

  const dpr = window.devicePixelRatio || 1;
  return (
    <div className="pdf-page-wrapper" data-pagenum={pageNum} ref={el => {
      containerRef.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) ref.current = el;
    }}>
      <div className="pdf-page-container" style={{ width: canvasDim.w / dpr || 'auto', height: canvasDim.h / dpr || 'auto', backgroundColor: '#fff', boxShadow: 'var(--shadow-sm)', marginBottom: '16px' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
});

function ComparisonPane({ label, onDocLoaded, pdfDoc, paneRef, currentPage, setCurrentPage, diffByPage, diffType, pagesWithDiffs, totalDiffs }) {
  const [scale] = useState(1.0);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedDiffPage, setSelectedDiffPageState] = useState(null);
  const { t } = useTranslation();
  const pageRefs = useRef({});
  const initialLoadDone = useRef(false);

  // Initialize selected page when pagesWithDiffs becomes available
  const effectiveSelectedPage = selectedDiffPage || pagesWithDiffs?.[0] || null;

  useEffect(() => {
    if (!pdfDoc || !paneRef.current) return;

    let visibilityMap = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageNum = parseInt(entry.target.dataset.pagenum);
          if (entry.isIntersecting) {
            visibilityMap.set(pageNum, entry.intersectionRect.height);
          } else {
            visibilityMap.delete(pageNum);
          }
        });

        if (visibilityMap.size > 0 && initialLoadDone.current) {
          let maxVisiblePage = null;
          let maxVisibleHeight = -1;
          visibilityMap.forEach((visibleHeight, pageNum) => {
            if (visibleHeight > maxVisibleHeight) {
              maxVisibleHeight = visibleHeight;
              maxVisiblePage = pageNum;
            }
          });
          
          if (maxVisiblePage !== null && currentPage !== maxVisiblePage) {
            setCurrentPage(maxVisiblePage);
          }
        }
      },
      {
        root: paneRef.current,
        threshold: Array.from({ length: 21 }, (_, i) => i * 0.05),
      }
    );

    const timer = setTimeout(() => {
      Object.keys(pageRefs.current).forEach(pageNum => {
        const el = pageRefs.current[pageNum];
        if (el) observer.observe(el);
      });
      initialLoadDone.current = true;
    }, 300);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [pdfDoc, currentPage, setCurrentPage, paneRef]);

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

  const pages = pdfDoc ? Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1) : [];

  const handlePageChange = (p) => {
    setCurrentPage(p);
    initialLoadDone.current = true;
    const el = pageRefs.current[p];
    if (el && paneRef.current) {
       // Offset relative to scroll container
       const pane = paneRef.current;
       pane.scrollTo({
          top: el.offsetTop - pane.offsetTop - 16,
          behavior: 'smooth'
       });
    }
  };

  return (
    <div className="comparison-pane" style={{ position: 'relative' }}>
      <div className="comparison-pane-header">
        <span className="comparison-pane-title">
          {pdfDoc ? label : 'No document'}
        </span>
        <button className="btn btn-secondary" onClick={handleSelectFile} style={{ fontSize: 12, padding: '4px 12px' }}>
          📂 {pdfDoc ? t('change') : t('selectPdf')}
        </button>
      </div>
      
      <div className="comparison-pane-content" ref={paneRef} style={{ padding: 16, scrollSnapType: 'none', display: pdfDoc ? 'block' : 'flex' }}>
        {pdfDoc ? (
          <div className="pdf-continuous-scroll" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            {pages.map(pageNum => (
              <ComparisonPage
                 key={pageNum}
                 ref={el => pageRefs.current[pageNum] = el}
                 pdfDoc={pdfDoc}
                 pageNum={pageNum}
                 scale={scale}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ margin: 'auto' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📄</div>
            <p>{t('selectPdfCompare')}</p>
          </div>
        )}
      </div>

      {diffByPage && pagesWithDiffs && pagesWithDiffs.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 64,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          background: diffType === 'added' ? 'var(--color-diff-add)' : 'var(--color-diff-remove)',
          border: `1px solid ${diffType === 'added' ? 'var(--color-diff-add-border)' : 'var(--color-diff-remove-border)'}`,
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-lg)',
          fontSize: 13,
          zIndex: 10,
          overflow: 'hidden',
        }}>
          {/* Resumen compacto con contador total */}
          <div style={{
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }} onClick={() => setShowDetails(!showDetails)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong>{diffType === 'added' ? t('newWords') : t('removedWords')}</strong>
              <span style={{
                background: 'rgba(0,0,0,0.15)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                fontSize: 12,
                fontWeight: 600,
              }}>
                {totalDiffs} {t('inPages', pagesWithDiffs.length)}
              </span>
            </div>
            <button style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              {showDetails ? t('hideDetails') : t('showDetails')}
              <span style={{ fontSize: 10 }}>{showDetails ? '▲' : '▼'}</span>
            </button>
          </div>

          {/* Panel de detalles expandido - separado por páginas */}
          {showDetails && (
            <div style={{
              borderTop: '1px solid rgba(0,0,0,0.1)',
              maxHeight: 350,
              overflow: 'auto',
              background: 'rgba(255,255,255,0.5)',
            }}>
              {/* Selector de páginas con diferencias */}
              <div style={{
                padding: '8px 12px',
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
                borderBottom: '1px solid rgba(0,0,0,0.1)',
                background: 'rgba(255,255,255,0.3)',
              }}>
                {pagesWithDiffs.map(pageNum => {
                  const count = diffByPage[pageNum]?.length || 0;
                  const isSelected = effectiveSelectedPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setSelectedDiffPageState(pageNum)}
                      style={{
                        background: isSelected
                          ? (diffType === 'added' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)')
                          : 'transparent',
                        border: `1px solid ${isSelected ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`,
                        borderRadius: 'var(--radius-sm)',
                        padding: '4px 10px',
                        fontSize: 12,
                        cursor: 'pointer',
                        fontWeight: isSelected ? 600 : 400,
                      }}
                    >
                      {t('page')} {pageNum} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Palabras de la página seleccionada */}
              {effectiveSelectedPage && diffByPage[effectiveSelectedPage] && (
                <div style={{ padding: 12 }}>
                  <div style={{ marginBottom: 8, fontSize: 11, color: 'rgba(0,0,0,0.6)' }}>
                    {t('differencesInPage', effectiveSelectedPage)}:
                  </div>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                  }}>
                    {diffByPage[effectiveSelectedPage].map((word, i) => (
                      <span key={i} style={{
                        background: diffType === 'added'
                          ? 'rgba(16, 185, 129, 0.25)'
                          : 'rgba(239, 68, 68, 0.25)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 13,
                        fontFamily: 'monospace',
                      }}>
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {pdfDoc && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, padding: 8, borderTop: '1px solid var(--color-border-light)',
          background: 'var(--color-surface)',
          zIndex: 1,
        }}>
          <button className="tool-btn" onClick={() => handlePageChange(Math.max(1, currentPage - 1))}>◀</button>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {currentPage} / {pdfDoc.numPages}
          </span>
          <button className="tool-btn" onClick={() => handlePageChange(Math.min(pdfDoc.numPages, currentPage + 1))}>▶</button>
        </div>
      )}
    </div>
  );
}

export default function Comparison() {
  const { t } = useTranslation();
  const [leftDoc, setLeftDoc] = useState(null);
  const [rightDoc, setRightDoc] = useState(null);
  const [leftPage, setLeftPage] = useState(1);
  const [rightPage, setRightPage] = useState(1);
  const [syncScroll, setSyncScroll] = useState(false);
  const [diffResult, setDiffResult] = useState(null);
  const [diffMode, setDiffMode] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const leftPaneRef = useRef(null);
  const rightPaneRef = useRef(null);

  const handleDiffModeToggle = () => {
    const newMode = !diffMode;
    setDiffMode(newMode);
    if (newMode && localStorage.getItem('hideDiffModal') !== 'true') {
      setShowDiffModal(true);
    }
  };

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

// Sync page numbers are handled by IntersectionObserver during syncScroll.

  // Compute full document diff (all pages)
  useEffect(() => {
    if (!diffMode || !leftDoc?.doc || !rightDoc?.doc) {
      return;
    }
    const compute = async () => {
      const result = await computeFullDiff(leftDoc, rightDoc);
      setDiffResult(result);
    };
    compute();
  }, [diffMode, leftDoc, rightDoc]);

  return (
    <div className="comparison-layout" style={{ height: '100%' }}>
      <div className="comparison-controls">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{t('syncScroll')}</span>
          <button
            className={`toggle ${syncScroll ? 'active' : ''}`}
            onClick={() => setSyncScroll(!syncScroll)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{t('diffMode')}</span>
          <button
            className={`toggle ${diffMode ? 'active' : ''}`}
            onClick={handleDiffModeToggle}
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
          diffByPage={diffMode ? diffResult?.removed : null}
          pagesWithDiffs={diffMode ? diffResult?.pagesWithDiffs : null}
          totalDiffs={diffMode ? (diffResult?.removed ? Object.values(diffResult.removed).reduce((sum, arr) => sum + arr.length, 0) : 0) : 0}
          diffType="removed"
        />
        <ComparisonPane
          label={rightDoc?.name || 'Document B'}
          pdfDoc={rightDoc?.doc}
          onDocLoaded={setRightDoc}
          paneRef={rightPaneRef}
          currentPage={rightPage}
          setCurrentPage={setRightPage}
          diffByPage={diffMode ? diffResult?.added : null}
          pagesWithDiffs={diffMode ? diffResult?.pagesWithDiffs : null}
          totalDiffs={diffMode ? (diffResult?.added ? Object.values(diffResult.added).reduce((sum, arr) => sum + arr.length, 0) : 0) : 0}
          diffType="added"
        />
      </div>

      {showDiffModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--color-surface)', padding: 24, borderRadius: 'var(--radius-lg)',
            width: 400, maxWidth: '90%', boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ marginBottom: 12 }}>{t('diffModeModalTitle')}</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24, lineHeight: 1.5 }}>
              {t('diffModeModalDesc')}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                <input type="checkbox" id="dontShowAgainCheck" />
                {t('dontShowAgain')}
              </label>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  if (document.getElementById('dontShowAgainCheck').checked) {
                    localStorage.setItem('hideDiffModal', 'true');
                  }
                  setShowDiffModal(false);
                }}
              >
                {t('gotIt')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
