import type { CaseSearchDocument } from './types'

export const DAY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const

export type LearningView = 'feedback' | 'failure' | 'timing'

export type SmartFilters = {
  dayStems: string[]
  dayPillars: string[]
  gender: '' | '男' | '女' | '未标注'
  topics: string[]
  methods: string[]
  views: LearningView[]
}

export type ParsedSmartQuery = SmartFilters & {
  terms: string[]
  recognized: string[]
}

export type SearchMatch = {
  item: CaseSearchDocument
  score: number
  reasons: string[]
}

export const EMPTY_FILTERS: SmartFilters = {
  dayStems: [],
  dayPillars: [],
  gender: '',
  topics: [],
  methods: [],
  views: [],
}

const stemElements: Record<string, string> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
}

const topicAliases: Record<string, string[]> = {
  事业职业: ['事业职业', '事业', '职业', '工作'],
  婚恋感情: ['婚恋感情', '婚恋', '婚姻', '感情'],
  预测复盘: ['预测复盘', '复盘'],
  学业考试: ['学业考试', '学业', '考试'],
  财富经营: ['财富经营', '财富', '财运', '经营'],
  健康灾病: ['健康灾病', '健康', '疾病', '灾病'],
  子息生育: ['子息生育', '子息', '生育', '子女'],
  性格人品: ['性格人品', '性格', '人品'],
  父母六亲: ['父母六亲', '父母', '六亲'],
  行业取象: ['行业取象', '行业', '取象'],
  时辰校验: ['时辰校验', '时辰', '校时'],
  时空问事: ['时空问事', '时空', '问事'],
  名人公共事件: ['名人公共事件', '名人', '公共事件'],
}

const methodAliases: Record<string, string[]> = {
  大运流年: ['大运流年', '大运', '流年', '应期'],
  合局: ['合局', '三合', '六合'],
  透干同根: ['透干同根', '透干', '同根'],
  神煞: ['神煞'],
  财星: ['财星', '正财', '偏财'],
  伤官: ['伤官'],
  冲: ['冲', '相冲'],
  '印绶/枭印': ['印绶/枭印', '印绶', '枭印', '正印', '偏印'],
  象法: ['象法'],
  制化做功: ['制化做功', '制化', '做功'],
  官杀: ['官杀', '正官', '七杀'],
  墓库: ['墓库', '财库', '官库', '印库'],
  食神: ['食神'],
  刑穿害: ['刑穿害', '刑', '穿', '害'],
  比劫: ['比劫', '比肩', '劫财'],
  六壬: ['六壬'],
  时空法: ['时空法'],
  旺衰调候: ['旺衰调候', '旺衰', '调候'],
  纳音: ['纳音'],
}

const viewAliases: Array<{ view: LearningView; aliases: string[]; label: string }> = [
  { view: 'feedback', aliases: ['只看反馈', '有反馈', '反馈案例'], label: '含反馈语句' },
  { view: 'failure', aliases: ['只看失误', '只看失败', '失误案例', '失败案例'], label: '含失误记录' },
  { view: 'timing', aliases: ['只看定时依据', '只看应期', '定时依据', '应期案例'], label: '含定时依据' },
]

function cleanText(value: string) {
  return value.replace(/[，。；、,;|/]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function unique(values: string[]) {
  return [...new Set(values)]
}

export function parseSmartQuery(query: string, availableTopics: string[], availableMethods: string[]): ParsedSmartQuery {
  let remaining = ` ${cleanText(query)} `
  const result: ParsedSmartQuery = { ...EMPTY_FILTERS, dayStems: [], dayPillars: [], topics: [], methods: [], views: [], terms: [], recognized: [] }

  const consume = (phrase: string) => {
    const target = [...phrase].length === 1 ? ` ${phrase} ` : phrase
    if (!remaining.includes(target)) return false
    remaining = remaining.replaceAll(target, ' ')
    return true
  }

  for (const marker of viewAliases) {
    if (marker.aliases.some(consume)) {
      result.views.push(marker.view)
      result.recognized.push(marker.label)
    }
  }

  const genderPatterns: Array<{ value: '男' | '女' | '未标注'; aliases: string[] }> = [
    { value: '女', aliases: ['女命', '坤造'] },
    { value: '男', aliases: ['男命', '乾造'] },
    { value: '未标注', aliases: ['性别未标注', '未知性别'] },
  ]
  for (const marker of genderPatterns) {
    if (marker.aliases.some(consume)) {
      result.gender = marker.value
      result.recognized.push(`性别：${marker.value}`)
      break
    }
  }

  const pillarPattern = /([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])/g
  for (const match of [...remaining.matchAll(pillarPattern)]) {
    result.dayPillars.push(match[1])
    result.recognized.push(`日柱：${match[1]}`)
    consume(match[1])
  }

  for (const stem of DAY_STEMS) {
    const aliases = [`日主${stem}`, `${stem}日主`, `${stem}${stemElements[stem]}`]
    if (aliases.some(consume)) {
      result.dayStems.push(stem)
      result.recognized.push(`日主：${stem}`)
    }
  }

  for (const [topic, aliases] of Object.entries(topicAliases)) {
    if (!availableTopics.includes(topic)) continue
    if (aliases.some(consume)) {
      result.topics.push(topic)
      result.recognized.push(`主题：${topic}`)
    }
  }

  for (const [method, aliases] of Object.entries(methodAliases)) {
    if (!availableMethods.includes(method)) continue
    if (aliases.some(consume)) {
      result.methods.push(method)
      result.recognized.push(`方法：${method}`)
    }
  }

  result.dayStems = unique(result.dayStems)
  result.dayPillars = unique(result.dayPillars)
  result.topics = unique(result.topics)
  result.methods = unique(result.methods)
  result.views = unique(result.views) as LearningView[]
  result.terms = cleanText(remaining).split(' ').filter(Boolean)
  if (result.terms.length) result.recognized.push(`原文：${result.terms.join(' + ')}`)
  return result
}

function containsFeedback(item: CaseSearchDocument) {
  return /反馈|回馈|事实为|事实是|后来证实|结果是/.test(`${item.body}\n${item.detail}`)
}

function containsFailure(item: CaseSearchDocument) {
  return /失误|失败|不准|未中|没测对|判断错误|看错|断错/.test(`${item.body}\n${item.detail}`)
}

function containsTiming(item: CaseSearchDocument) {
  return item.methods.includes('大运流年') || /应期|流年|流月|大运|交运|哪年|何年/.test(`${item.body}\n${item.detail}`)
}

function mergedFilters(manual: SmartFilters, parsed: ParsedSmartQuery): SmartFilters {
  return {
    dayStems: unique([...manual.dayStems, ...parsed.dayStems]),
    dayPillars: unique([...manual.dayPillars, ...parsed.dayPillars]),
    gender: manual.gender || parsed.gender,
    topics: unique([...manual.topics, ...parsed.topics]),
    methods: unique([...manual.methods, ...parsed.methods]),
    views: unique([...manual.views, ...parsed.views]) as LearningView[],
  }
}

export function searchCases(items: CaseSearchDocument[], manual: SmartFilters, parsed: ParsedSmartQuery): SearchMatch[] {
  const filters = mergedFilters(manual, parsed)
  return items.flatMap((item) => {
    const topics = new Set(item.topics.split('|').filter(Boolean))
    const methods = new Set(item.methods.split('|').filter(Boolean))
    if (filters.dayStems.length && !filters.dayStems.includes(item.day_stem || '')) return []
    if (filters.dayPillars.length && !filters.dayPillars.includes(item.day_pillar || '')) return []
    if (filters.gender === '未标注' ? item.gender : filters.gender && item.gender !== filters.gender) return []
    if (!filters.topics.every((value) => topics.has(value))) return []
    if (!filters.methods.every((value) => methods.has(value))) return []
    if (filters.views.includes('feedback') && !containsFeedback(item)) return []
    if (filters.views.includes('failure') && !containsFailure(item)) return []
    if (filters.views.includes('timing') && !containsTiming(item)) return []

    const haystack = `${item.printed_label}\n${item.title}\n${item.day_pillar || ''}\n${item.topics}\n${item.methods}\n${item.body}\n${item.detail}`.toLowerCase()
    if (!parsed.terms.every((term) => haystack.includes(term.toLowerCase()))) return []

    let score = 0
    const reasons: string[] = []
    if (filters.dayStems.includes(item.day_stem || '')) { score += 5; reasons.push(`${item.day_stem}日主`) }
    if (filters.dayPillars.includes(item.day_pillar || '')) { score += 6; reasons.push(`日柱${item.day_pillar}`) }
    if (filters.gender && (filters.gender === '未标注' ? !item.gender : item.gender === filters.gender)) { score += 2; reasons.push(filters.gender === '未标注' ? '性别未标注' : `${item.gender}命`) }
    for (const topic of filters.topics) if (topics.has(topic)) { score += 3; reasons.push(topic) }
    for (const method of filters.methods) if (methods.has(method)) { score += 3; reasons.push(method) }
    if (filters.views.includes('feedback')) { score += 2; reasons.push('含反馈') }
    if (filters.views.includes('failure')) { score += 2; reasons.push('含失误') }
    if (filters.views.includes('timing')) { score += 2; reasons.push('含定时依据') }
    for (const term of parsed.terms) {
      if (item.title.includes(term)) score += 6
      else if (`${item.topics}|${item.methods}`.includes(term)) score += 4
      else score += 1
      reasons.push(`命中“${term}”`)
    }
    return [{ item, score, reasons: unique(reasons).slice(0, 5) }]
  }).sort((a, b) => b.score - a.score || a.item.section_index - b.item.section_index)
}
