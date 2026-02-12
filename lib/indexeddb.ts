/**
 * IndexedDB helper utilities with feature detection
 */

/**
 * Delete an IndexedDB database with proper error handling
 * @param name - Database name to delete
 * @returns Promise that resolves when deletion completes or fails gracefully
 */
export function deleteIndexedDBAsync(name: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.deleteDatabase(name);
      req.onsuccess = () => {
        console.log('Deleted indexedDB', name);
        resolve();
      };
      req.onblocked = () => {
        console.warn('Delete blocked for indexedDB', name);
        resolve();
      };
      req.onerror = (e) => {
        console.warn('Error deleting indexedDB', name, e);
        resolve();
      };
    } catch (e) {
      console.warn('deleteIndexedDBAsync exception', name, e);
      resolve();
    }
  });
}

/**
 * Get all IndexedDB databases with feature detection
 * @returns Promise with array of database info or empty array if not supported
 */
export async function getAllDatabases(): Promise<IDBDatabaseInfo[]> {
  if (typeof indexedDB === 'undefined' || !indexedDB.databases) {
    return [];
  }

  try {
    return await indexedDB.databases();
  } catch (e) {
    console.warn('Failed to get databases:', e);
    return [];
  }
}

/**
 * Delete all IndexedDB databases matching a filter function
 * @param filter - Function that returns true for databases to delete
 */
export async function deleteMatchingDatabases(
  filter: (name: string) => boolean
): Promise<void> {
  const databases = await getAllDatabases();

  for (const db of databases) {
    if (!db.name) continue;
    if (filter(db.name)) {
      await deleteIndexedDBAsync(db.name);
    }
  }
}
