import type { LocalRecord, LocalRecordKind } from './types'

export const BACKUP_FORMAT = 'linzhonggui-notes'
const LEGACY_BACKUP_FORMAT = 'zhou-study-notes'
const RECORD_KINDS = new Set<LocalRecordKind>(['case', 'training', 'quiz', 'blind', 'practice'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireString(record: Record<string, unknown>, field: string, index: number) {
  const value = record[field]
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`备份中第 ${index + 1} 条记录的 ${field} 无效。`)
}

function validateOptional(record: Record<string, unknown>, field: string, type: 'string' | 'boolean' | 'number', index: number) {
  const value = record[field]
  if (value === undefined) return
  if (typeof value !== type || type === 'number' && !Number.isFinite(value)) {
    throw new Error(`备份中第 ${index + 1} 条记录的 ${field} 无效。`)
  }
}

function validateLocalRecord(value: unknown, index: number): LocalRecord {
  if (!isRecord(value)) throw new Error(`备份中第 ${index + 1} 条记录不是有效对象。`)
  requireString(value, 'id', index)
  requireString(value, 'caseUid', index)
  requireString(value, 'body', index)
  requireString(value, 'updatedAt', index)
  if (typeof value.kind !== 'string' || !RECORD_KINDS.has(value.kind as LocalRecordKind)) {
    throw new Error(`备份中第 ${index + 1} 条记录的 kind 无效。`)
  }
  for (const field of ['ruleId', 'lastReviewedAt', 'nextReviewAt']) validateOptional(value, field, 'string', index)
  for (const field of ['revealed', 'completed']) validateOptional(value, field, 'boolean', index)
  for (const field of ['reviewCount', 'confidence', 'quizScore', 'quizTotal']) validateOptional(value, field, 'number', index)
  return value as LocalRecord
}

export function serializeRecordsBackup(records: LocalRecord[]) {
  return JSON.stringify({ format: BACKUP_FORMAT, version: 1, exportedAt: new Date().toISOString(), records }, null, 2)
}

export function parseRecordsBackup(text: string): LocalRecord[] {
  const parsed: unknown = JSON.parse(text)
  if (!isRecord(parsed) || parsed.format !== BACKUP_FORMAT && parsed.format !== LEGACY_BACKUP_FORMAT || !Array.isArray(parsed.records)) {
    throw new Error('不是有效的林中归学习记录备份。')
  }
  return parsed.records.map(validateLocalRecord)
}
