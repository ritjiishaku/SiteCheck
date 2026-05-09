export interface SyncQueueItem {
  id?: number
  url: string
  method: string
  headers: Record<string, string>
  payload: unknown
  created_at: string
}

const DB_NAME = 'sitecheck_db'
const STORE_NAME = 'sync_queue'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

export async function addToSyncQueue(item: Omit<SyncQueueItem, 'created_at' | 'id'>): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.add({ ...item, created_at: new Date().toISOString() })
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function deleteFromSyncQueue(id: number): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(id)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function flushSyncQueue(): Promise<void> {
  const queue = await getSyncQueue()
  if (queue.length === 0) return

  for (const item of queue) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: JSON.stringify(item.payload),
      })
      if (res.ok) {
        await deleteFromSyncQueue(item.id!)
      } else {
        console.error(`[SyncManager] Sync failed for ${item.url} with status ${res.status}`)
        // We stop flushing on the first hard failure to maintain order
        if (res.status >= 500) break;
      }
    } catch (err) {
      console.error('[SyncManager]', err)
      break
    }
  }
}
