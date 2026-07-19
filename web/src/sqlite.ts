import sqlite3InitModule, { type Database, type Sqlite3Static, type BindableValue } from '@sqlite.org/sqlite-wasm'

export class LocalStudyDatabase {
  private sqlite3: Sqlite3Static | null = null
  private db: Database | null = null

  async open(bytes: ArrayBuffer): Promise<void> {
    this.close()
    const sqlite3 = await sqlite3InitModule()
    const db = new sqlite3.oo1.DB()
    const pointer = sqlite3.wasm.allocFromTypedArray(bytes)
    try {
      const flags = sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE | sqlite3.capi.SQLITE_DESERIALIZE_READONLY
      db.checkRc(sqlite3.capi.sqlite3_deserialize(db.pointer!, 'main', pointer, bytes.byteLength, bytes.byteLength, flags))
      const requiredTables = ['cases', 'charts', 'training_cards', 'learning_rules']
      const tables = db.exec({
        sql: "SELECT name FROM sqlite_master WHERE type='table'",
        rowMode: 0,
        returnValue: 'resultRows',
      }) as string[]
      const missingTables = requiredTables.filter((name) => !tables.includes(name))
      if (missingTables.length) throw new Error(`缺少必要数据表：${missingTables.join('、')}`)
    } catch (error) {
      try { db.close() } catch { sqlite3.wasm.dealloc(pointer) }
      throw error
    }
    this.sqlite3 = sqlite3
    this.db = db
  }

  query<T extends Record<string, unknown>>(sql: string, bind: readonly BindableValue[] = []): T[] {
    if (!this.db) throw new Error('数据库尚未载入。')
    return this.db.exec({
      sql,
      bind,
      rowMode: 'object',
      returnValue: 'resultRows',
    }) as T[]
  }

  value<T = string>(sql: string, bind: readonly BindableValue[] = []): T | undefined {
    if (!this.db) throw new Error('数据库尚未载入。')
    const rows = this.db.exec({
      sql,
      bind,
      rowMode: 0,
      returnValue: 'resultRows',
    })
    return rows[0] as T | undefined
  }

  metadata(): Record<string, string> {
    return Object.fromEntries(this.query<{ key: string; value: string }>('SELECT key, value FROM metadata').map((row) => [row.key, row.value]))
  }

  close(): void {
    if (this.db) this.db.close()
    this.db = null
    this.sqlite3 = null
  }
}
