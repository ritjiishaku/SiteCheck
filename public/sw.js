const CACHE_NAME = 'sitecheck-v1'
const DB_NAME = 'sitecheck_db'
const STORE_NAME = 'sync_queue'

const STATIC_ASSETS = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/about',
  '/offline',
  '/dashboard/medic',
  '/dashboard/manager',
  '/dashboard/drugs',
  '/dashboard/reports',
  '/dashboard/admin',
  '/dashboard/super-admin',
  '/dashboard/patient-intake',
  '/dashboard/subscription',
]

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

async function addToSyncQueue(request) {
  const db = await openDB()
  const payload = await request.clone().json()
  const headers = {}
  for (let [key, value] of request.headers.entries()) {
    headers[key] = value
  }

  const item = {
    url: request.url,
    method: request.method,
    headers,
    payload,
    created_at: new Date().toISOString()
  }

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.add(item)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve()
  })
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // For API mutations, try network first, then queue in IndexedDB
  if (request.url.includes('/api/v1/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    event.respondWith(
      fetch(request.clone()).catch(async () => {
        // Network failed, queue the request
        await addToSyncQueue(request)
        // Return a dummy success response so the client app doesn't crash
        return new Response(JSON.stringify({ success: true, offline: true, message: 'Saved offline' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      })
    )
    return
  }

  // Standard cache-first or network-first for GET requests
  if (request.method === 'GET') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    )
  }
})

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-mutations') {
    event.waitUntil(flushQueue())
  }
})

async function flushQueue() {
  const db = await openDB()
  const queue = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

  if (queue.length === 0) return

  for (const item of queue) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: JSON.stringify(item.payload),
      })
      
      if (res.ok) {
        await new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite')
          const store = tx.objectStore(STORE_NAME)
          const req = store.delete(item.id)
          req.onsuccess = () => resolve()
          req.onerror = () => reject(req.error)
        })
      } else {
        if (res.status >= 500) break;
      }
    } catch {
      break
    }
  }
}
