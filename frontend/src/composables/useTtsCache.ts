/**
 * Композабл для кэширования синтезированной речи в IndexedDB.
 *
 * Позволяет кэшировать результаты TTS-синтеза (только для Go IPC / Python TTS,
 * так как Web Speech API не предоставляет raw audio) для мгновенного
 * воспроизведения при повторении тех же слов.
 *
 * Кэш: LRU, макс. 1000 записей, ключ = `${lang}:${text}`.
 *
 * @module composables/useTtsCache
 */

/** Версия схемы IndexedDB — при изменении структуры БД инкрементить */
const DB_VERSION = 1
/** Название базы данных */
const DB_NAME = 'yappari-tts-cache'
/** Название хранилища */
const STORE_NAME = 'audio'
/** Максимальное количество записей в кэше */
const MAX_ENTRIES = 1000

/** Запись в кэше */
interface TtsCacheEntry {
  key: string
  audioData: string
  mime: string
  createdAt: number
  lastAccessed: number
  accessCount: number
}

/** Открывает/создаёт базу IndexedDB */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' })
        store.createIndex('lastAccessed', 'lastAccessed', { unique: false })
        store.createIndex('accessCount', 'accessCount', { unique: false })
      }
    }

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result)
    }

    request.onerror = (event) => {
      console.warn('TTS Cache: не удалось открыть IndexedDB:', (event.target as IDBOpenDBRequest).error)
      reject((event.target as IDBOpenDBRequest).error)
    }
  })
}

/**
 * Удаляет самые старые записи, если кэш превысил MAX_ENTRIES.
 * LRU-эвiction: удаляем записи с самым старым lastAccessed.
 */
const evictIfNeeded = async (db: IDBDatabase): Promise<void> => {
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const count = await new Promise<number>((resolve, reject) => {
    const req = store.count()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

  if (count <= MAX_ENTRIES) return

  // Нужно удалить лишние записи
  const deleteTx = db.transaction(STORE_NAME, 'readwrite')
  const deleteStore = deleteTx.objectStore(STORE_NAME)
  const index = deleteStore.index('lastAccessed')
  const toDelete = count - MAX_ENTRIES

  // Получаем самые старые записи
  const oldEntries = await new Promise<TtsCacheEntry[]>((resolve, reject) => {
    const entries: TtsCacheEntry[] = []
    const req = index.openCursor(null, 'next') // сортировка по возрастанию = самые старые
    req.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
      if (cursor && entries.length < toDelete) {
        entries.push(cursor.value as TtsCacheEntry)
        cursor.continue()
      } else {
        resolve(entries)
      }
    }
    req.onerror = () => reject(req.error)
  })

  // Удаляем их
  await Promise.all(
    oldEntries.map((entry) => {
      return new Promise<void>((resolve, reject) => {
        const req = deleteStore.delete(entry.key)
        req.onsuccess = () => resolve()
        req.onerror = () => reject(req.error)
      })
    })
  )
}

/**
 * Получает кэшированное аудио по тексту и языку.
 *
 * @param text - текст для озвучки
 * @param lang - код языка (например, `ja-JP`, `ru-RU`)
 * @returns data URL аудио или null, если в кэше нет
 */
export const getCachedAudio = async (text: string, lang: string): Promise<string | null> => {
  const key = `${lang}:${text}`

  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    const entry = await new Promise<TtsCacheEntry | undefined>((resolve, reject) => {
      const req = store.get(key)
      req.onsuccess = () => resolve(req.result as TtsCacheEntry | undefined)
      req.onerror = () => reject(req.error)
    })

    if (entry) {
      // Обновляем счётчик обращений
      entry.lastAccessed = Date.now()
      entry.accessCount++
      store.put(entry)
      return entry.audioData
    }

    return null
  } catch (e) {
    console.warn('TTS Cache: ошибка чтения:', e)
    return null
  }
}

/**
 * Сохраняет аудио в кэш.
 *
 * @param text - текст для озвучки
 * @param lang - код языка (например, `ja-JP`, `ru-RU`)
 * @param audioData - data URL аудио (base64)
 * @param mime - MIME-тип аудио
 */
export const setCachedAudio = async (
  text: string,
  lang: string,
  audioData: string,
  mime: string,
): Promise<void> => {
  const key = `${lang}:${text}`
  const now = Date.now()

  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    await new Promise<void>((resolve, reject) => {
      const req = store.put({
        key,
        audioData,
        mime,
        createdAt: now,
        lastAccessed: now,
        accessCount: 1,
      } as TtsCacheEntry)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })

    // Проверяем лимит и удаляем старые записи
    await evictIfNeeded(db)
  } catch (e) {
    console.warn('TTS Cache: ошибка записи:', e)
  }
}

/**
 * Очищает весь кэш TTS.
 */
export const clearCache = async (): Promise<void> => {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    await new Promise<void>((resolve, reject) => {
      const req = store.clear()
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch (e) {
    console.warn('TTS Cache: ошибка очистки:', e)
  }
}

/**
 * Возвращает количество записей в кэше.
 */
export const getCacheSize = async (): Promise<number> => {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    return await new Promise<number>((resolve, reject) => {
      const req = store.count()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } catch {
    return 0
  }
}
