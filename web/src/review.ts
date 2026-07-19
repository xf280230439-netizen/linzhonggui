import type { LocalRecord } from './types'

export const REVIEW_LEVELS = [
  { confidence: 1, label: '生疏', days: 1 },
  { confidence: 2, label: '模糊', days: 3 },
  { confidence: 3, label: '基本懂', days: 7 },
  { confidence: 4, label: '较熟', days: 14 },
  { confidence: 5, label: '掌握', days: 30 },
] as const

export function nextReviewAt(confidence: number, from = new Date()) {
  const level = REVIEW_LEVELS.find((item) => item.confidence === confidence) || REVIEW_LEVELS[2]
  const next = new Date(from)
  next.setDate(next.getDate() + level.days)
  next.setHours(8, 0, 0, 0)
  return next.toISOString()
}

export function dueCaseRecords(records: LocalRecord[], now = new Date()) {
  return records
    .filter((record) => record.kind === 'case' && record.nextReviewAt && new Date(record.nextReviewAt) <= now)
    .sort((a, b) => new Date(a.nextReviewAt!).getTime() - new Date(b.nextReviewAt!).getTime())
}
