// Service worker: keeps a copy of everything the game has loaded, so the game starts
// without a connection. Files are kept as they are used; there is no list to maintain.
const CACHE = 'spacetrader-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => event.waitUntil(takeOver()))

// Drops copies kept under an older cache name and starts serving open pages at once.
async function takeOver() {
  for (const key of await caches.keys()) {
    if (key !== CACHE) await caches.delete(key)
  }
  await self.clients.claim()
}

// The page sends the addresses it loaded before this worker was in charge.
self.addEventListener('message', (event) => {
  const addresses = event.data?.cache
  if (Array.isArray(addresses)) event.waitUntil(keepAll(addresses))
})

// One at a time, so that one file that cannot be fetched does not stop the rest.
async function keepAll(addresses) {
  const cache = await caches.open(CACHE)
  await Promise.allSettled([...new Set(addresses)].map((address) => cache.add(address)))
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return
  event.respondWith(request.mode === 'navigate' ? freshPage(request) : keptFile(request))
})

// The page itself: the newest version when online, the kept copy when not.
async function freshPage(request) {
  try {
    return await fetchAndKeep(request)
  } catch {
    return (await kept(request)) ?? (await kept('./')) ?? Response.error()
  }
}

// Scripts, styles and pictures: their names change when their content does, so a kept
// copy never goes stale.
async function keptFile(request) {
  return (await kept(request)) ?? fetchAndKeep(request)
}

// A kept copy is matched by its address alone. Servers often mark files as varying by
// request headers, which would make a copy fetched one way invisible to a request made
// another way.
function kept(request) {
  return caches.match(request, { ignoreVary: true })
}

async function fetchAndKeep(request) {
  const response = await fetch(request)
  if (response.ok) (await caches.open(CACHE)).put(request, response.clone())
  return response
}
