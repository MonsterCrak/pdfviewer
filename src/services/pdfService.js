import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/**
 * Load a PDF document from an ArrayBuffer
 */
export async function loadPdfDocument(arrayBuffer) {
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  return loadingTask.promise;
}

/**
 * Render a single page to a canvas element
 */
export async function renderPage(pdfDoc, pageNum, canvas, scale = 1.5) {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  return { width: viewport.width, height: viewport.height };
}

/**
 * Generate a thumbnail (render page 1 at low scale) and return as data URL
 */
export async function getThumbnail(pdfDoc, pageNum = 1, thumbScale = 0.4) {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: thumbScale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d');
  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;

  return canvas.toDataURL('image/jpeg', 0.7);
}

/**
 * Render a thumbnail directly onto a provided canvas
 */
export async function renderThumbnail(pdfDoc, pageNum, canvas, maxWidth = 100) {
  const page = await pdfDoc.getPage(pageNum);
  const unscaledVp = page.getViewport({ scale: 1 });
  const scale = maxWidth / unscaledVp.width;
  const viewport = page.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const ctx = canvas.getContext('2d');
  await page.render({
    canvasContext: ctx,
    viewport,
  }).promise;
}

/**
 * Extract text content from a page
 */
export async function getTextContent(pdfDoc, pageNum) {
  const page = await pdfDoc.getPage(pageNum);
  const textContent = await page.getTextContent();
  return textContent.items.map(item => item.str).join(' ');
}

/**
 * Extract text from all pages
 */
export async function getAllText(pdfDoc) {
  const pages = [];
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const text = await getTextContent(pdfDoc, i);
    pages.push({ page: i, text });
  }
  return pages;
}
