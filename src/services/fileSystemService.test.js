import { describe, it, expect, beforeEach } from 'vitest';
import { isFileSystemSupported, readFileAsArrayBuffer, getFileMetadata } from './fileSystemService';

describe('fileSystemService', () => {
  beforeEach(() => {
    // Reset any window properties that might be modified by other tests
    delete window.showDirectoryPicker;
  });

  it('isFileSystemSupported should return false when API is unavailable', () => {
    expect(isFileSystemSupported()).toBe(false);
  });

  it('isFileSystemSupported should return true when showDirectoryPicker exists', () => {
    window.showDirectoryPicker = () => {};
    expect(isFileSystemSupported()).toBe(true);
  });

  it('readFileAsArrayBuffer should resolve from File objects', async () => {
    const content = new Uint8Array([0, 1, 2, 3]);
    const file = new File([content], 'test.pdf', { type: 'application/pdf' });
    const buffer = await readFileAsArrayBuffer(file);
    expect(buffer).toBeInstanceOf(ArrayBuffer);
    expect(new Uint8Array(buffer)).toEqual(content);
  });

  it('getFileMetadata should return expected metadata for File objects', async () => {
    const content = new Uint8Array([0, 1, 2, 3]);
    const file = new File([content], 'mypdf.pdf', { type: 'application/pdf', lastModified: 1234 });
    const metadata = await getFileMetadata(file);

    expect(metadata).toMatchObject({
      name: 'mypdf.pdf',
      size: file.size,
      lastModified: file.lastModified,
      type: 'application/pdf',
    });
  });
});
