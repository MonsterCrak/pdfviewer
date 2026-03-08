import { openDB } from "idb";

const DB_NAME = "lfph-db";
const DB_VERSION = 1;

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Files store
        if (!db.objectStoreNames.contains("files")) {
          const fileStore = db.createObjectStore("files", { keyPath: "id" });
          fileStore.createIndex("name", "name");
          fileStore.createIndex("collectionId", "collectionId");
          fileStore.createIndex("lastOpened", "lastOpened");
        }
        // Collections store
        if (!db.objectStoreNames.contains("collections")) {
          db.createObjectStore("collections", { keyPath: "id" });
        }
        // Annotations store
        if (!db.objectStoreNames.contains("annotations")) {
          const annStore = db.createObjectStore("annotations", {
            keyPath: "id",
          });
          annStore.createIndex("fileId", "fileId");
          annStore.createIndex("pageNum", "pageNum");
        }
        // Directory handles store
        if (!db.objectStoreNames.contains("dirHandles")) {
          db.createObjectStore("dirHandles", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

// --- Files ---
export async function getAllFiles() {
  const db = await getDB();
  const files = await db.getAll("files");
  return files.sort((a, b) => (b.lastOpened || 0) - (a.lastOpened || 0));
}

export async function getFile(id) {
  const db = await getDB();
  return db.get("files", id);
}

export async function putFile(file) {
  const db = await getDB();
  return db.put("files", file);
}

export async function deleteFile(id) {
  const db = await getDB();
  // Also delete related annotations
  const annotations = await getAnnotationsByFile(id);
  const tx = db.transaction(["files", "annotations"], "readwrite");
  await tx.objectStore("files").delete(id);
  for (const ann of annotations) {
    await tx.objectStore("annotations").delete(ann.id);
  }
  await tx.done;
}

export async function getFilesByCollection(collectionId) {
  const db = await getDB();
  return db.getAllFromIndex("files", "collectionId", collectionId);
}

// --- Collections ---
export async function getAllCollections() {
  const db = await getDB();
  return db.getAll("collections");
}

export async function getCollection(id) {
  const db = await getDB();
  return db.get("collections", id);
}

export async function putCollection(collection) {
  const db = await getDB();
  return db.put("collections", collection);
}

export async function deleteCollection(id) {
  const db = await getDB();
  // Remove collection reference from files
  const files = await getFilesByCollection(id);
  const tx = db.transaction(["collections", "files"], "readwrite");
  await tx.objectStore("collections").delete(id);
  for (const file of files) {
    file.collectionId = null;
    await tx.objectStore("files").put(file);
  }
  await tx.done;
}

// --- Annotations ---
export async function getAnnotationsByFile(fileId) {
  const db = await getDB();
  return db.getAllFromIndex("annotations", "fileId", fileId);
}

export async function putAnnotation(annotation) {
  const db = await getDB();
  return db.put("annotations", annotation);
}

export async function deleteAnnotation(id) {
  const db = await getDB();
  return db.delete("annotations", id);
}

export async function deleteAnnotationsByFile(fileId) {
  const db = await getDB();
  const annotations = await getAnnotationsByFile(fileId);
  const tx = db.transaction("annotations", "readwrite");
  for (const ann of annotations) {
    await tx.store.delete(ann.id);
  }
  await tx.done;
}

// --- Directory Handles ---
export async function saveDirHandle(id, handle) {
  const db = await getDB();
  return db.put("dirHandles", { id, handle });
}

export async function getDirHandle(id) {
  const db = await getDB();
  const result = await db.get("dirHandles", id);
  return result?.handle;
}

export async function getAllDirHandles() {
  const db = await getDB();
  return db.getAll("dirHandles");
}

export async function deleteDirHandle(id) {
  const db = await getDB();
  return db.delete("dirHandles", id);
}
