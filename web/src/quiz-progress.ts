import { buildCaseQuiz, type QuizQuestion } from './quiz'
import type { LocalStudyDatabase } from './sqlite'
import type { Chart, LocalRecord } from './types'

export type QuizCaseSource = {
  case_uid: string
  methods: string
}

export type QuizEvaluation = {
  questions: QuizQuestion[]
  answers: Record<string, string>
  answered: number
  total: number
  score: number
  complete: boolean
  wrong: QuizQuestion[]
}

export const QUIZ_SKILLS = [
  { questionId: 'day-stem', label: '日主', foundationFocus: 'stems' },
  { questionId: 'hidden-stems', label: '地支藏干', foundationFocus: 'hidden' },
  { questionId: 'nayin', label: '纳音', foundationFocus: 'nayin' },
  { questionId: 'chart-relation', label: '干支关系', foundationFocus: 'relations' },
  { questionId: 'method', label: '案例方法' },
  { questionId: 'month-pillar', label: '月柱' },
] as const

export function quizSkillFor(questionId: string) {
  return QUIZ_SKILLS.find((item) => item.questionId === questionId) || { questionId, label: '基础事实' }
}

export function parseQuizAnswers(body?: string): Record<string, string> {
  if (!body) return {}
  try {
    const parsed = JSON.parse(body)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export function evaluateQuizCases(db: LocalStudyDatabase, cases: QuizCaseSource[], records: LocalRecord[]) {
  const methodPool = db.query<{ tag: string }>("SELECT tag FROM tags WHERE kind='method' GROUP BY tag ORDER BY COUNT(*) DESC").map((item) => item.tag)
  const charts = db.query<Chart>(`SELECT ch.* FROM charts ch
    JOIN (
      SELECT case_uid, MIN(chart_index) AS chart_index
      FROM charts WHERE length(day_pillar)=2 GROUP BY case_uid
    ) first_chart ON first_chart.case_uid=ch.case_uid AND first_chart.chart_index=ch.chart_index`)
  const chartIndex = new Map(charts.map((chart) => [chart.case_uid, chart]))
  const recordIndex = new Map(records.filter((record) => record.kind === 'quiz').map((record) => [record.caseUid, record]))
  return new Map(cases.map((item) => {
    const chart = chartIndex.get(item.case_uid)
    const questions = chart ? buildCaseQuiz(item.case_uid, chart, item.methods ? item.methods.split('|').filter(Boolean) : [], methodPool) : []
    const answers = parseQuizAnswers(recordIndex.get(item.case_uid)?.body)
    const answeredQuestions = questions.filter((question) => Boolean(answers[question.id]))
    const wrong = answeredQuestions.filter((question) => answers[question.id] !== question.answer)
    const evaluation: QuizEvaluation = {
      questions,
      answers,
      answered: answeredQuestions.length,
      total: questions.length,
      score: answeredQuestions.length - wrong.length,
      complete: questions.length > 0 && answeredQuestions.length === questions.length,
      wrong,
    }
    return [item.case_uid, evaluation] as const
  }))
}

export function quizMistakeLabels(evaluation?: QuizEvaluation) {
  if (!evaluation) return []
  return [...new Set(evaluation.wrong.map((question) => quizSkillFor(question.id).label))]
}
