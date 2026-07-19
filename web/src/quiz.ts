import { HIDDEN_STEMS, NAYIN, hiddenStemsFor, nayinFor } from './foundations'
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
