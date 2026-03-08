import React, { useRef, useEffect, useState, useCallback } from 'react';
import useAppStore from '../stores/appStore';
import useTranslation from '../hooks/useTranslation';
import AiPanel from '../components/AiPanel';
import { renderPage, renderThumbnail } from '../services/pdfService';

const HIGHLIGHT_COLORS = [
  { name: 'Lilac', value: '#DDD6FE' },
  { name: 'Mint', value: '#A7F3D0' },
  { name: 'Blue', value: '#BFDBFE' },
  { name: 'Yellow', value: '#FDE68A' },
];

export default function Viewer() {
  const openTabs = useAppStore(s => s.openTabs);
  const activeTabId = useAppStore(s => s.activeTabId);
  const updateTab = useAppStore(s => s.updateTab);
  const activeTool = useAppStore(s => s.activeTool);
  const setActiveTool = useAppStore(s => s.setActiveTool);
  const activeColor = useAppStore(s => s.activeColor);
  const setActiveColor = useAppStore(s => s.setActiveColor);
  const rightPanelOpen = useAppStore(s => s.rightPanelOpen);
  const toggleRightPanel = useAppStore(s => s.toggleRightPanel);
  const showStickyNotes = useAppStore(s => s.showStickyNotes);
  const toggleStickyNotes = useAppStore(s => s.toggleStickyNotes);
  const annotations = useAppStore(s => s.annotations);
  const addAnnotation = useAppStore(s => s.addAnnotation);
  const loadAnnotations = useAppStore(s => s.loadAnnotations);
  const removeAnnotation = useAppStore(s => s.removeAnnotation);
  const setView = useAppStore(s => s.setView);
  const { t } = useTranslation();

  const [scale, setScale] = useState(1.0);
  const pagesContainerRef = useRef(null);
  const pageRefs = useRef({});
  const visibilityMap = useRef(new Map());
  const initialLoadDone = useRef(false);

  const activeTab = openTabs.find(t => t.id === activeTabId);

  // Clear page refs on tab switch to avoid ghost refs
  useEffect(() => {
    pageRefs.current = {};
    initialLoadDone.current = false;
  }, [activeTabId]);

  // Load annotations
  useEffect(() => {
    if (activeTab?.id) {
      loadAnnotations(activeTab.id);
    } else {
      useAppStore.setState({ annotations: [] });
    }
  }, [activeTab?.id, loadAnnotations]);

  // Centralized Intersection Observer with better logic
  useEffect(() => {
    if (!activeTab || !pagesContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageNum = parseInt(entry.target.dataset.pagenum);
          if (entry.isIntersecting) {
            // Use intersectionRect.height as score to see which page owns most of the viewport
            visibilityMap.current.set(pageNum, entry.intersectionRect.height);
          } else {
            visibilityMap.current.delete(pageNum);
          }
        });

        if (visibilityMap.current.size > 0 && initialLoadDone.current) {
          // Find the page with the maximum visible height
          let maxVisiblePage = null;
          let maxVisibleHeight = -1;

          visibilityMap.current.forEach((visibleHeight, pageNum) => {
            if (visibleHeight > maxVisibleHeight) {
              maxVisibleHeight = visibleHeight;
              maxVisiblePage = pageNum;
            }
          });
          
          if (maxVisiblePage !== null && activeTab.currentPage !== maxVisiblePage) {
            updateTab(activeTab.id, { currentPage: maxVisiblePage });
          }
        }
      },
      {
        root: pagesContainerRef.current,
        // Trigger at lots of small intervals as it scrolls over a page
        threshold: Array.from({ length: 21 }, (_, i) => i * 0.05),
      }
    );

    const timer = setTimeout(() => {
      Object.keys(pageRefs.current).forEach(pageNum => {
        const el = pageRefs.current[pageNum];
        if (el) observer.observe(el);
      });
    }, 300);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
      visibilityMap.current.clear();
    };
  }, [activeTabId, activeTab?.id, updateTab, activeTab?.currentPage]);

  // Ensure Page 1 is shown at top
  useEffect(() => {
    const el = pagesContainerRef.current;
    if (!el || !activeTab) return;

    const handleScroll = () => {
      // Allow observer to work after user starts scrolling
      initialLoadDone.current = true;
      
      if (el.scrollTop < 20 && activeTab.currentPage !== 1) {
        updateTab(activeTab.id, { currentPage: 1 });
      }
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [activeTab, updateTab]);

  // Initial scroll to page (or top)
  useEffect(() => {
    if (activeTabId && activeTab) {
      const pageToScroll = activeTab.currentPage || 1;
      
      // Force top synchronously for page 1
      if (pageToScroll === 1 && pagesContainerRef.current) {
         pagesContainerRef.current.scrollTop = 0;
      }
      
      const timer = setTimeout(() => {
        const pageEl = pageRefs.current[pageToScroll];
        if (pageToScroll === 1 && pagesContainerRef.current) {
          pagesContainerRef.current.scrollTop = 0;
        } else if (pageEl) {
          pageEl.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
        initialLoadDone.current = true; // Safety timeout in case no scroll event happens
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTabId]); // Only on tab switch

  const handlePageChange = useCallback((pageNum) => {
    if (!activeTab) return;
    const clamped = Math.max(1, Math.min(pageNum, activeTab.totalPages));
    updateTab(activeTab.id, { currentPage: clamped });
    
    // Explicitly flag user interaction so observer takes over properly
    initialLoadDone.current = true;
    
    const pageEl = pageRefs.current[clamped];
    if (clamped === 1 && pagesContainerRef.current) {
      pagesContainerRef.current.scrollTo({ top: 0, behavior: 'auto' });
    } else if (pageEl) {
      pageEl.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, [activeTab, updateTab]);

  const clearAllAnnotations = async () => {
    if (!activeTab) return;
    if (window.confirm(t('confirmClearAnnotations'))) {
      const docAnnots = annotations.filter(a => a.fileId === activeTab.id);
      for (const a of docAnnots) {
        await removeAnnotation(a.id, activeTab.id);
      }
    }
  };

  if (!activeTab) {
    return (
      <div className="app-content">
        <div className="empty-state" style={{ height: '100%' }}>
          <div style={{ fontSize: 64 }}>📄</div>
          <h3>{t('noDocOpen')}</h3>
          <button className="btn btn-primary" onClick={() => setView('dashboard')} style={{ marginTop: 16 }}>
            {t('goToDashboard')}
          </button>
        </div>
      </div>
    );
  }

  const pages = Array.from({ length: activeTab.totalPages }, (_, i) => i + 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="toolbar">
        <button
          className={`tool-btn ${activeTool === 'highlight' ? 'active' : ''}`}
          onClick={() => setActiveTool('highlight')}
          title={t('highlight')}
        >✏️</button>
        {HIGHLIGHT_COLORS.map(c => (
          <div
            key={c.value}
            className={`color-dot ${activeColor === c.value ? 'active' : ''}`}
            style={{ background: c.value }}
            onClick={() => setActiveColor(c.value)}
          />
        ))}
        <div className="toolbar-divider" />
        <button className="tool-btn" onClick={toggleStickyNotes} title={showStickyNotes ? t('hideStickyNotes') : t('showStickyNotes')}>
          {showStickyNotes ? '👁️' : '🙈'}
        </button>
        <button className={`tool-btn ${activeTool === 'sticky' ? 'active' : ''}`} onClick={() => setActiveTool('sticky')}>📌</button>
        <button className={`tool-btn ${activeTool === 'draw' ? 'active' : ''}`} onClick={() => setActiveTool('draw')}>🖊️</button>
        <button className={`tool-btn ${activeTool === 'eraser' ? 'active' : ''}`} onClick={() => setActiveTool('eraser')}>🧹</button>
        <div className="toolbar-divider" />
        <button className="tool-btn danger-hover" onClick={clearAllAnnotations} title={t('clearAll')}>🗑️</button>
        <div className="toolbar-divider" />
        <div className="zoom-controls">
          <button className="tool-btn" onClick={() => setScale(s => Math.max(0.2, s - 0.2))}>−</button>
          <span className="zoom-label">{Math.round(scale * 100)}%</span>
          <button className="tool-btn" onClick={() => setScale(s => Math.min(4, s + 0.2))}>+</button>
        </div>
        <div className="toolbar-divider" />
        <button className="tool-btn" onClick={() => handlePageChange(activeTab.currentPage - 1)} disabled={activeTab.currentPage <= 1}>◀</button>
        <span style={{ fontSize: 13, minWidth: 60, textAlign: 'center' }}>
          {activeTab.currentPage} / {activeTab.totalPages}
        </span>
        <button className="tool-btn" onClick={() => handlePageChange(activeTab.currentPage + 1)} disabled={activeTab.currentPage >= activeTab.totalPages}>▶</button>
        <div style={{ flex: 1 }} />
        <button className="btn btn-secondary" onClick={toggleRightPanel}>
          {rightPanelOpen ? t('hideAi') : t('showAi')}
        </button>
      </div>

      <div className="viewer-layout">
        <div className="viewer-sidebar-left">
          {pages.map(pageNum => (
            <PageThumbItem
              key={pageNum}
              pdfDoc={activeTab.pdfDoc}
              pageNum={pageNum}
              isActive={activeTab.currentPage === pageNum}
              onSelect={handlePageChange}
            />
          ))}
        </div>
        <div className="viewer-canvas-area" ref={pagesContainerRef}>
          <div className="pdf-continuous-scroll">
            {pages.map(pageNum => (
              <PdfPage
                key={`${activeTab.id}-${pageNum}`}
                ref={el => pageRefs.current[pageNum] = el}
                pageNum={pageNum}
                pdfDoc={activeTab.pdfDoc}
                scale={scale}
                activeTool={activeTool}
                activeColor={activeColor}
                showStickyNotes={showStickyNotes}
                onAnnotationAdd={addAnnotation}
                onAnnotationRemove={removeAnnotation}
                annotations={annotations.filter(a => a.pageNum === pageNum && a.fileId === activeTab.id)}
                fileId={activeTab.id}
                t={t}
              />
            ))}
          </div>
        </div>
        <div className={`viewer-sidebar-right ${rightPanelOpen ? '' : 'collapsed'}`}>
          {rightPanelOpen && <AiPanel />}
        </div>
      </div>
    </div>
  );
}

// Distance helper
function getSqDistToSegment(p, v, w) {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return (p.x - v.x) ** 2 + (p.y - v.y) ** 2;
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return (p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))) ** 2;
}

const PdfPage = React.forwardRef(({ pdfDoc, pageNum, scale, activeTool, activeColor, showStickyNotes, annotations, onAnnotationAdd, onAnnotationRemove, fileId, t }, ref) => {
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isRendered, setIsRendered] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPaths, setDrawPaths] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [canvasDim, setCanvasDim] = useState({ w: 0, h: 0 });
  const [dragNote, setDragNote] = useState(null);

  const render = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;
    try {
      const dim = await renderPage(pdfDoc, pageNum, canvasRef.current, scale);
      setCanvasDim({ w: dim.width, h: dim.height });
      setIsRendered(true);
    } catch (e) { console.error("Page render error", pageNum, e); }
  }, [pdfDoc, pageNum, scale]);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !isRendered) render();
    }, { threshold: 0.01, rootMargin: '600px' });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [render, isRendered]);

  const getCoords = useCallback((e) => {
    if (!overlayCanvasRef.current) return { x: 0, y: 0 };
    const rect = overlayCanvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (overlayCanvasRef.current.width / rect.width),
      y: (e.clientY - rect.top) * (overlayCanvasRef.current.height / rect.height)
    };
  }, []);

  useEffect(() => {
    if (!dragNote) return;
    const handleGlobalMouseMove = (e) => {
       const { x, y } = getCoords(e);
       const note = annotations.find(n => n.id === dragNote.id);
       if (note) {
          onAnnotationAdd({...note, data: {...note.data, x: x - dragNote.offsetLeft, y: y - dragNote.offsetTop}});
       }
    };
    const handleGlobalMouseUp = () => setDragNote(null);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
       window.removeEventListener('mousemove', handleGlobalMouseMove);
       window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [dragNote, annotations, onAnnotationAdd, getCoords]);

  useEffect(() => {
    if (isRendered) render();
  }, [scale, render, isRendered]);

  useEffect(() => {
    if (!overlayCanvasRef.current || !canvasRef.current || !isRendered) return;
    const canvas = overlayCanvasRef.current;
    const mainCanvas = canvasRef.current;
    canvas.width = mainCanvas.width;
    canvas.height = mainCanvas.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    annotations.forEach(a => {
      if (a.type === 'highlight') {
        ctx.fillStyle = a.data.color + '80';
        ctx.fillRect(a.data.x, a.data.y, a.data.width, a.data.height);
      } else if (a.type === 'draw') {
        ctx.strokeStyle = a.data.color;
        ctx.lineWidth = 2 * scale * (window.devicePixelRatio || 1);
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (a.data.points.length > 1) {
          ctx.moveTo(a.data.points[0].x, a.data.points[0].y);
          a.data.points.forEach(p => ctx.lineTo(p.x, p.y));
          ctx.stroke();
        }
      }
    });

    drawPaths.forEach(path => {
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 2 * scale * (window.devicePixelRatio || 1);
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (path.length > 1) {
        ctx.moveTo(path[0].x, path[0].y);
        path.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      }
    });

    highlights.forEach(h => {
      ctx.fillStyle = activeColor + '40';
      const x = Math.min(h.sX, h.eX), y = Math.min(h.sY, h.eY);
      ctx.fillRect(x, y, Math.abs(h.eX - h.sX), Math.abs(h.eY - h.sY));
    });
  }, [annotations, drawPaths, highlights, isRendered, activeColor, scale]);

  const handleMouseDown = e => {
    if (!activeTool) return;
    const { x, y } = getCoords(e);
    if (activeTool === 'eraser') {
      // Increase hit threshold to make selecting lines easier
      const threshold = 40 * scale;
      const found = annotations.find(a => {
        if (a.type === 'highlight') {
          // Expanded hit box for highlights
          return x >= a.data.x - threshold && x <= a.data.x + a.data.width + threshold &&
                 y >= a.data.y - threshold && y <= a.data.y + a.data.height + threshold;
        }
        if (a.type === 'draw') {
          for (let i = 0; i < a.data.points.length - 1; i++) {
            if (getSqDistToSegment({ x, y }, a.data.points[i], a.data.points[i + 1]) < threshold * threshold) return true;
          }
        }
        return false;
      });
      if (found) onAnnotationRemove(found.id, fileId);
      return;
    }
    setIsDrawing(true);
    if (activeTool === 'draw') setDrawPaths(p => [...p, [{ x, y }]]);
    else if (activeTool === 'highlight') setHighlights([{ sX: x, sY: y, eX: x, eY: y }]);
    else if (activeTool === 'sticky') {
      onAnnotationAdd({ id: `sticky-${Date.now()}`, fileId, pageNum, type: 'sticky', data: { x, y, text: '' } });
      setIsDrawing(false);
    }
  };

  const handleMouseMove = e => {
    if (!isDrawing) return;
    const { x, y } = getCoords(e);
    if (activeTool === 'draw') {
      setDrawPaths(p => { const c = [...p]; c[c.length - 1] = [...c[c.length - 1], { x, y }]; return c; });
    } else if (activeTool === 'highlight') setHighlights(p => [{ ...p[0], eX: x, eY: y }]);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (activeTool === 'draw' && drawPaths.length > 0) {
      onAnnotationAdd({ id: `draw-${Date.now()}`, fileId, pageNum, type: 'draw', data: { points: drawPaths[drawPaths.length - 1], color: activeColor } });
      setDrawPaths([]);
    } else if (activeTool === 'highlight' && highlights.length > 0) {
      const h = highlights[0];
      const x = Math.min(h.sX, h.eX), y = Math.min(h.sY, h.eY), w = Math.abs(h.eX - h.sX), height = Math.abs(h.eY - h.sY);
      if (w > 5 && height > 5) onAnnotationAdd({ id: `hl-${Date.now()}`, fileId, pageNum, type: 'highlight', data: { x, y, width: w, height: height, color: activeColor } });
      setHighlights([]);
    }
  };

  const dpr = window.devicePixelRatio || 1;
  return (
    <div className="pdf-page-wrapper" data-pagenum={pageNum} ref={el => {
      containerRef.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) ref.current = el;
    }}>
      <div className="pdf-page-container" style={{ width: canvasDim.w / dpr || 'auto', height: canvasDim.h / dpr || 'auto' }}>
        <canvas ref={canvasRef} />
        <canvas ref={overlayCanvasRef} className={`annotation-overlay ${activeTool ? 'active ' + activeTool : ''} ${activeTool === 'eraser' ? 'eraser-mode' : ''}`}
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />
        {showStickyNotes && annotations.filter(n => n.type === 'sticky').map(note => (
          <div 
             key={note.id} 
             className="sticky-note" 
             style={{ left: note.data.x / dpr, top: note.data.y / dpr }}
             onMouseDown={(e) => {
                if(e.target.tagName.toLowerCase() === 'textarea' || e.target.tagName.toLowerCase() === 'button') return;
                const {x, y} = getCoords(e);
                setDragNote({ id: note.id, offsetLeft: x - note.data.x, offsetTop: y - note.data.y });
                e.stopPropagation();
             }}
          >
            <button className="delete-note-btn" onClick={() => onAnnotationRemove(note.id, fileId)}>✕</button>
            <textarea defaultValue={note.data.text} placeholder={t('typeNoteHere')} onChange={e => onAnnotationAdd({...note, data: {...note.data, text: e.target.value}})} />
          </div>
        ))}
      </div>
    </div>
  );
});

function PageThumbItem({ pdfDoc, pageNum, isActive, onSelect }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && pdfDoc) renderThumbnail(pdfDoc, pageNum, ref.current, 200).catch(() => {});
  }, [pdfDoc, pageNum]);
  return (
    <div className="page-thumb-wrapper">
      <div className={`page-thumb ${isActive ? 'active' : ''}`} onClick={() => onSelect(pageNum)}>
        <canvas ref={ref} />
      </div>
      <div className="page-thumb-label">{pageNum}</div>
    </div>
  );
}
