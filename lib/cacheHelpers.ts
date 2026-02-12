/**
 * Cache API and Service Worker helper utilities
 */

/**
 * Delete all Cache API entries matching a filter function
 * @param filter - Function that returns true for cache names to delete
 */
export async function deleteMatchingCaches(
  filter: (name: string) => boolean
): Promise<void> {
  if (typeof caches === 'undefined') {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      if (filter(name)) {
        try {
          await caches.delete(name);
          console.log('Deleted cache:', name);
        } catch (e) {
          console.warn('Failed to delete cache', name, e);
        }
      }
    }
  } catch (e) {
    console.warn('Error while deleting caches:', e);
  }
}

/**
 * Unregister all service workers
 */
export async function unregisterAllServiceWorkers(): Promise<void> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.serviceWorker ||
    !navigator.serviceWorker.getRegistrations
  ) {
    return;
  }

  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      try {
        await reg.unregister();
        console.log('Unregistered service worker', reg);
      } catch (e) {
        console.warn('Failed to unregister service worker', e);
      }
    }
  } catch (e) {
    console.warn('Error while checking service workers', e);
  }
}
