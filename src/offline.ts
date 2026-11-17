// Makes the game work without a connection after the first visit, by handing the files
// it loaded to the service worker in public/sw.js.
export async function registerOffline(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  await navigator.serviceWorker.register('sw.js');
  const { active } = await navigator.serviceWorker.ready;
  // These were loaded before the worker was in charge, so it has not seen them.
  const loaded = performance
    .getEntriesByType('resource')
    .map(entry => entry.name)
    .filter(address => address.startsWith(location.origin));
  active?.postMessage({ cache: [location.href, ...loaded] });
}
