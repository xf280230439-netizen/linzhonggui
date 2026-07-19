import type { DatabaseAsset, LocalRecord } from './types'

const DB_NAME = 'zhou-study-local'
const DB_VERSION = 1
const ASSETS = 'assets'
const RECORDS = 'records'

function openLocalDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(ASSETS)) db.createObjectStore(ASSETS, { keyPath: 'key' })
      if (!db.objectStoreNames.contains(RECORDS)) {
        const store = db.createObjectStore(RECORDS, { keyPath: 'id' })
        store.createIndex('kind', 'kind')
        store.createIndex('caseUid', 'caseUid')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getDatabaseAsset(): Promise<DatabaseAsset | undefined> {
  const db = await openLocalDb()
  try {
    return await requestResult(db.transaction(ASSETS, 'readonly').objectStore(ASSETS).get('database'))
  } finally {
    db.close()
  }
}

export async function saveDatabaseAsset(asset: DatabaseAsset): Promise<void> {
  const db = await openLocalDb()
  try {
    await requestResult(db.transaction(ASSETS, 'readwrite').objectStore(ASSETS).put(asset))
  } finally {
    db.close()
  }
}

export async function removeDatabaseAsset(): Promise<void> {
  const db = await openLocalDb()
  try {
    await requestResult(db.transaction(ASSETS, 'readwrite').objectStore(ASSETS).delete('database'))
  } finally {
    db.close()
  }
}

export async function getLocalRecord(id: string): Promise<LocalRecord | undefined> {
  const db = await openLocalDb()
  try {
    return await requestResult(db.transaction(RECORDS, 'readonly').objectStore(RECORDS).get(id))
  } finally {
    db.close()
  }
}

export async function getAllLocalRecords(): Promise<LocalRecord[]> {
  const db = await openLocalDb()
  try {
    return await requestResult(db.transaction(RECORDS, 'readonly').objectStore(RECORDS).getAll())
  } finally {
    db.close()
  }
}

export async function saveLocalRecord(record: LocalRecord): Promise<void> {
  const db = await openLocalDb()
  try {
    await requestResult(db.transaction(RECORDS, 'readwrite').objectStore(RECORDS).put(record))
  } finally {
    db.close()
  }
}

export async function importLocalRecords(records: LocalRecord[]): Promise<void> {
  const db = await openLocalDb()
  try {
    const transaction = db.transaction(RECORDS, 'readwrite')
    const store = transaction.objectStore(RECORDS)
    for (const record of records) store.put(record)
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
  } finally {
    db.close()
  }
}
