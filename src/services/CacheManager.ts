import { 
  CacheManager as ICacheManager,
  ReadingHistoryItem
} from '../types'

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
  etag?: string
  lastModified?: string
}

interface CacheMetadata {
  key: string
  timestamp: number
  ttl: number
  size: number
  etag?: string
  lastModified?: string
}

export class CacheManager implements ICacheManager {
  private readonly dbName = 'alexandria-cache'
  private readonly dbVersion = 1
  private readonly storeName = 'content'
  private readonly metadataPrefix = 'alexandria-meta-'
  private readonly historyKey = 'alexandria-history'
  private readonly defaultTTL = 6 * 60 * 60 * 1000 // 6 hours in milliseconds

  private db: IDBDatabase | null = null

  constructor() {
    this.initDB()
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB()
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB')
    }
    return this.db
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // First check if item exists and is not expired
      const metadata = this.getMetadata(key)
      if (!metadata || this.isExpired(metadata)) {
        await this.invalidateKey(key)
        return null
      }

      // Try localStorage first for small items
      const localItem = localStorage.getItem(key)
      if (localItem) {
        try {
          const parsed = JSON.parse(localItem) as CacheItem<T>
          if (!this.isExpired(parsed)) {
            return parsed.data
          }
        } catch {
          // If parsing fails, continue to IndexedDB
        }
      }

      // Try IndexedDB for larger items
      const db = await this.ensureDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly')
        const store = transaction.objectStore(this.storeName)
        const request = store.get(key)

        request.onsuccess = () => {
          const result = request.result
          if (result && !this.isExpired(result)) {
            resolve(result.data)
          } else {
            resolve(null)
          }
        }

        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.warn('Cache get error:', error)
      return null
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const actualTTL = ttl || this.defaultTTL
    const timestamp = Date.now()
    const item: CacheItem<T> = {
      data: value,
      timestamp,
      ttl: actualTTL
    }

    try {
      // Try localStorage first for small items
      const serialized = JSON.stringify(item)
      const sizeKB = new Blob([serialized]).size / 1024

      if (sizeKB < 100) { // Less than 100KB, use localStorage
        localStorage.setItem(key, serialized)
        this.setMetadata(key, {
          key,
          timestamp,
          ttl: actualTTL,
          size: sizeKB
        })
      } else {
        // Use IndexedDB for larger items
        const db = await this.ensureDB()
        await new Promise<void>((resolve, reject) => {
          const transaction = db.transaction([this.storeName], 'readwrite')
          const store = transaction.objectStore(this.storeName)
          const request = store.put({ key, ...item })

          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })

        this.setMetadata(key, {
          key,
          timestamp,
          ttl: actualTTL,
          size: sizeKB
        })
      }
    } catch (error) {
      console.warn('Cache set error:', error)
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      // Clear localStorage items matching pattern
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes(pattern)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))

      // Clear IndexedDB items matching pattern
      const db = await this.ensureDB()
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        const request = store.openCursor()

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result
          if (cursor) {
            if (cursor.key.toString().includes(pattern)) {
              cursor.delete()
            }
            cursor.continue()
          } else {
            resolve()
          }
        }

        request.onerror = () => reject(request.error)
      })

      // Clear metadata
      this.clearMetadataPattern(pattern)
    } catch (error) {
      console.warn('Cache invalidate error:', error)
    }
  }

  async getReadingHistory(): Promise<ReadingHistoryItem[]> {
    try {
      const historyJson = localStorage.getItem(this.historyKey)
      if (historyJson) {
        return JSON.parse(historyJson)
      }
      return []
    } catch {
      return []
    }
  }

  async addToHistory(item: ReadingHistoryItem): Promise<void> {
    try {
      const history = await this.getReadingHistory()
      
      // Remove duplicate if exists
      const filtered = history.filter(h => 
        !(h.owner === item.owner && h.repo === item.repo && h.path === item.path)
      )
      
      // Add to beginning
      filtered.unshift(item)
      
      // Keep only last 50 items
      const trimmed = filtered.slice(0, 50)
      
      localStorage.setItem(this.historyKey, JSON.stringify(trimmed))
    } catch (error) {
      console.warn('Failed to add to history:', error)
    }
  }

  // Helper methods for conditional requests
  getCacheHeaders(key: string): { 'If-None-Match'?: string; 'If-Modified-Since'?: string } {
    const metadata = this.getMetadata(key)
    const headers: { 'If-None-Match'?: string; 'If-Modified-Since'?: string } = {}
    
    if (metadata?.etag) {
      headers['If-None-Match'] = metadata.etag
    }
    
    if (metadata?.lastModified) {
      headers['If-Modified-Since'] = metadata.lastModified
    }
    
    return headers
  }

  updateCacheHeaders(key: string, etag?: string, lastModified?: string): void {
    const metadata = this.getMetadata(key)
    if (metadata) {
      if (etag) metadata.etag = etag
      if (lastModified) metadata.lastModified = lastModified
      this.setMetadata(key, metadata)
    }
  }

  private getMetadata(key: string): CacheMetadata | null {
    try {
      const metadataJson = localStorage.getItem(this.metadataPrefix + key)
      return metadataJson ? JSON.parse(metadataJson) : null
    } catch {
      return null
    }
  }

  private setMetadata(key: string, metadata: CacheMetadata): void {
    try {
      localStorage.setItem(this.metadataPrefix + key, JSON.stringify(metadata))
    } catch (error) {
      console.warn('Failed to set metadata:', error)
    }
  }

  private clearMetadataPattern(pattern: string): void {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this.metadataPrefix) && key.includes(pattern)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }

  private async invalidateKey(key: string): Promise<void> {
    localStorage.removeItem(key)
    localStorage.removeItem(this.metadataPrefix + key)
    
    try {
      const db = await this.ensureDB()
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        const request = store.delete(key)

        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.warn('Failed to invalidate key from IndexedDB:', error)
    }
  }

  private isExpired(item: CacheItem<any> | CacheMetadata): boolean {
    return Date.now() > (item.timestamp + item.ttl)
  }

  // Utility method to get cache statistics
  async getCacheStats(): Promise<{ localStorage: number; indexedDB: number; totalItems: number }> {
    let localStorageCount = 0
    let indexedDBCount = 0

    // Count localStorage items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && !key.startsWith(this.metadataPrefix) && key !== this.historyKey) {
        localStorageCount++
      }
    }

    // Count IndexedDB items
    try {
      const db = await this.ensureDB()
      indexedDBCount = await new Promise<number>((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly')
        const store = transaction.objectStore(this.storeName)
        const request = store.count()

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })
    } catch {
      indexedDBCount = 0
    }

    return {
      localStorage: localStorageCount,
      indexedDB: indexedDBCount,
      totalItems: localStorageCount + indexedDBCount
    }
  }
}