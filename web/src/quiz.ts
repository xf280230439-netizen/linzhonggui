import { HIDDEN_STEMS, NAYIN, detectChartRelations, hiddenStemsFor, nayinFor } from './foundations'
import { DAY_STEMS } from './search'
import type { Chart } from './types'

export type QuizQuestion = {
  id: string
  prompt: string
  options: string[]
  answer: string
  explanation: string
}

function hash(value: string) {
  let result = 2166136261
  for (const character of value) result = Math.imul(result ^ character.charCodeAt(0), 16777619)
  return result >>> 0
}

function stableShuffle(values: string[], seed: string) {
  return [...values].sort((a, b) => hash(`${seed}:${a}`) - hash(`${seed}:${b}`))
}

function optionsFor(answer: string, pool: string[], seed: string) {
  const distractors = stableShuffle([...new Set(pool.filter((item) => item && item !== answer))], seed).slice(0, 3)
  return stableShuffle([answer, ...distractors], `${seed}:options`)
}

export function buildCaseQuiz(caseUid: string, chart: Chart, methods: string[], methodPool: string[]): QuizQuestion[] {
  const dayBranch = chart.day_pillar.slice(-1)
  const hidden = hiddenStemsFor(dayBranch).join('、')
  const nayin = nayinFor(chart.day_pillar)
  const method = methods[0] || methodPool[0]
  const hiddenPool = HIDDEN_STEMS.map((item) => item.stems.join('、'))
  const nayinPool = NAYIN.map((item) => item.name)
  const pillarPool = NAYIN.flatMap((item) => item.pillars)
  const relations = detectChartRelations(chart)
  const locationCounts = new Map<string, number>()
  for (const relation of relations) {
    const key = relation.locations.join('|')
    locationCounts.set(key, (locationCounts.get(key) || 0) + 1)
  }
  const relation = relations
    .filter((item) => locationCounts.get(item.locations.join('|')) === 1)
    .sort((first, second) => hash(`${caseUid}:relation:${first.id}`) - hash(`${caseUid}:relation:${second.id}`))[0]
  const relationTypes = ['天干五合', '天干相克', '地支六合', '地支三合', '地支三会', '地支六冲', '地支相刑', '地支六害（穿）', '地支六破']
  const relationQuestions: QuizQuestion[] = relation ? [{
    id: 'chart-relation',
    prompt: `命盘中的${relation.locations.join('、')}（${relation.members}）属于哪种基础关系？`,
    options: optionsFor(relation.type, relationTypes, `${caseUid}:relation-options`),
    answer: relation.type,
    explanation: `${relation.locations.join('、')}构成${relation.members}，基础表归为“${relation.type}”${relation.result ? `，传统配属为${relation.result}` : ''}。关系名称只用于识别结构，不能单独判断吉凶。`,
  }] : []

  return [
    {
      id: 'day-stem',
      prompt: `日柱为${chart.day_pillar}，本例日主是什么？`,
      options: optionsFor(chart.day_stem, [...DAY_STEMS], `${caseUid}:stem`),
      answer: chart.day_stem,
      explanation: `日柱天干为${chart.day_stem}，因此日主是${chart.day_stem}。`,
    },
    {
      id: 'hidden-stems',
      prompt: `日支${dayBranch}藏有哪些天干？`,
      options: optionsFor(hidden, hiddenPool, `${caseUid}:hidden`),
      answer: hidden,
      explanation: `${dayBranch}支藏干为${hidden}，顺序按藏干表记录。`,
    },
    {
      id: 'nayin',
      prompt: `日柱${chart.day_pillar}的纳音是什么？`,
      options: optionsFor(nayin, nayinPool, `${caseUid}:nayin`),
      answer: nayin,
      explanation: `六十甲子纳音表中，${chart.day_pillar}对应${nayin}。`,
    },
    ...relationQuestions,
    methods.length ? {
      id: 'method',
      prompt: '以下哪一项被资料库标记为本案例的方法？',
      options: optionsFor(method, methodPool, `${caseUid}:method`),
      answer: method,
      explanation: `本案例的方法标签包含“${method}”。这只是资料库标签，不代表唯一解释。`,
    } : {
      id: 'month-pillar',
      prompt: '以下哪一项是本命盘的月柱？',
      options: optionsFor(chart.month_pillar, pillarPool, `${caseUid}:month`),
      answer: chart.month_pillar,
      explanation: `本命盘月柱为${chart.month_pillar}。本题只核对排盘信息。`,
    },
  ].filter((question) => question.answer)
}
