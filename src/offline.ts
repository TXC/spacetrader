// Registers the service worker (src/sw.ts), which makes the game work without a
// connection after the first visit.
export async function registerOffline(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  await navigator.serviceWorker.register('sw.js');
}
