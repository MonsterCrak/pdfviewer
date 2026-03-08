import { saveDirHandle, getAllDirHandles } from './indexedDBService';

/**
 * Check if the native File System Access API is available
 * (Chrome, Edge support it; Brave blocks it via Shields)
 */
export function isFileSystemSupported() {
  return 'showDirectoryPicker' in window;
}

/* ------------------------------------------------------------------ */
/*  NATIVE  File System Access API  (Chrome / Edge)                   */
/* ------------------------------------------------------------------ */

/**
 * Open native folder picker and return the directory handle
 */
export async function pickDirectory() {
  const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
  await saveDirHandle(dirHandle.name, dirHandle);
  return dirHandle;
}

/**
 * Recursively scan a directory handle for PDF files
 */
export async function scanForPdfs(dirHandle, path = '') {
  const pdfs = [];
  for await (const [name, handle] of dirHandle) {
    const fullPath = path ? `${path}/${name}` : name;
    if (handle.kind === 'file' && name.toLowerCase().endsWith('.pdf')) {
      pdfs.push({
        name,
        path: fullPath,
        handle,
        dirHandleKey: dirHandle.name,
      });
    } else if (handle.kind === 'directory') {
      const subPdfs = await scanForPdfs(handle, fullPath);
      pdfs.push(...subPdfs);
    }
  }
  return pdfs;
}

/**
 * Read a file as ArrayBuffer (works with both handle-based and File objects)
 */
export async function readFileAsArrayBuffer(fileHandleOrFile) {
  // If it's a native File already (from <input> fallback), just read it
  if (fileHandleOrFile instanceof File) {
    return fileHandleOrFile.arrayBuffer();
  }
  // Otherwise it's a FileSystemFileHandle
  const file = await fileHandleOrFile.getFile();
  return file.arrayBuffer();
}

/**
 * Read a file and return basic metadata
 */
export async function getFileMetadata(fileHandle) {
  const file = fileHandle instanceof File ? fileHandle : await fileHandle.getFile();
  return {
    name: file.name,
    size: file.size,
    lastModified: file.lastModified,
    type: file.type,
  };
}

/**
 * Write data (ArrayBuffer/Blob) back to disk via the file handle
 */
export async function writeFile(fileHandle, data) {
  const writable = await fileHandle.createWritable();
  await writable.write(data);
  await writable.close();
}

/**
 * Re-request permission for a stored directory handle
 */
export async function requestPermission(dirHandle) {
  const opts = { mode: 'readwrite' };
  if ((await dirHandle.queryPermission(opts)) === 'granted') {
    return true;
  }
  if ((await dirHandle.requestPermission(opts)) === 'granted') {
    return true;
  }
  return false;
}

/**
 * Load all previously-saved directory handles and verify permissions
 */
export async function loadSavedDirectories() {
  const entries = await getAllDirHandles();
  const valid = [];
  for (const entry of entries) {
    try {
      const granted = await requestPermission(entry.handle);
      if (granted) {
        valid.push(entry);
      }
    } catch (e) {
      console.warn('Could not restore handle for', entry.id, e);
    }
  }
  return valid;
}

/**
 * Open a single PDF via native file picker (Chrome/Edge)
 */
export async function pickSinglePdf() {
  const [fileHandle] = await window.showOpenFilePicker({
    types: [{
      description: 'PDF Files',
      accept: { 'application/pdf': ['.pdf'] },
    }],
    multiple: false,
  });
  return fileHandle;
}

/* ------------------------------------------------------------------ */
/*  FALLBACK – Hidden <input type="file"> for Brave / Firefox / etc.  */
/* ------------------------------------------------------------------ */

/**
 * Helper: create a hidden <input>, trigger click, and resolve with chosen files.
 */
function triggerFileInput(options = {}) {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';

    if (options.accept) input.accept = options.accept;
    if (options.multiple) input.multiple = true;
    if (options.webkitdirectory) input.webkitdirectory = true;

    input.addEventListener('change', () => {
      const files = Array.from(input.files || []);
      document.body.removeChild(input);
      if (files.length === 0) {
        reject(new DOMException('The user aborted a request.', 'AbortError'));
      } else {
        resolve(files);
      }
    });

    // Handle cancel (user closes the dialog without selecting)
    input.addEventListener('cancel', () => {
      document.body.removeChild(input);
      reject(new DOMException('The user aborted a request.', 'AbortError'));
    });

    document.body.appendChild(input);
    input.click();
  });
}

/**
 * Fallback: pick a folder using <input webkitdirectory>.
 * Returns an array of File objects (only PDFs) instead of a dirHandle.
 */
export async function pickDirectoryFallback() {
  const allFiles = await triggerFileInput({ webkitdirectory: true });
  const pdfs = allFiles.filter(f => f.name.toLowerCase().endsWith('.pdf'));
  return pdfs;
}

/**
 * Fallback: pick one or more PDF files using <input type="file">.
 * Returns a single File object.
 */
export async function pickSinglePdfFallback() {
  const files = await triggerFileInput({ accept: '.pdf', multiple: false });
  return files[0];
}

/**
 * Fallback: pick multiple PDF files.
 * Returns an array of File objects.
 */
export async function pickMultiplePdfsFallback() {
  const files = await triggerFileInput({ accept: '.pdf', multiple: true });
  return files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
}
