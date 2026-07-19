export type RouteName = 'home' | 'training' | 'quiz' | 'library' | 'rules' | 'cases' | 'case' | 'rule' | 'training-card' | 'blind' | 'practice'

export type Route = {
  name: RouteName
  id?: string
  secondaryId?: string
}

export type DatabaseAsset = {
  key: 'database'
  name: string
  size: number
  importedAt: string
  bytes: ArrayBuffer
}

export type LocalRecordKind = 'case' | 'training' | 'quiz' | 'blind' | 'practice' | 'foundation'

export type LocalRecord = {
  id: string
  kind: LocalRecordKind
  caseUid: string
  ruleId?: string
  body: string
  revealed?: boolean
  completed?: boolean
  reviewCount?: number
  confidence?: number
  quizScore?: number
  quizTotal?: number
  lastReviewedAt?: string
  nextReviewAt?: string
  updatedAt: string
}

export type CaseSummary = {
  case_uid: string
  printed_label: string
  title: string
  gender: string | null
  day_pillar: string | null
  chart_count: number
  topics: string
  methods: string
  has_detail: number
}

export type CaseDetail = CaseSummary & {
  section_index: number
  day_stem: string | null
  body: string
  detail: string
}

export type CaseSearchDocument = CaseSummary & {
  section_index: number
  day_stem: string | null
  body: string
  detail: string
}

export type Chart = {
  chart_id: string
  case_uid: string
  chart_index: number
  chart_type: string
  gender: string | null
  year_pillar: string
  month_pillar: string
  day_pillar: string
  hour_pillar: string
  day_stem: string
}

export type TrainingModule = {
  module_id: string
  sequence: number
  title: string
  objective: string
}

export type TrainingCard = {
  case_uid: string
  module_id: string
  sequence: number
  training_mode: string
  focus: string
  prompts_json: string
  checkpoints_json: string
  evidence_lens: string
  caution: string
  teacher_chain_json: string
  outcome_status: string
  outcome_summary: string
  printed_label: string
  title: string
}

export type RuleFamily = {
  family_id: string
  sequence: number
  title: string
  question: string
  boundary: string
}

export type RuleSummary = {
  rule_id: string
  family_id: string
  sequence: number
  status: string
  version: string
  statement: string
  scope: string
  prediction: string
  prerequisites_json: string
  boundary_conditions_json: string
  competing_explanations_json: string
  family_title: string
  evidence_count: number
  holdout_count: number
}

export type RuleEvidence = {
  evidence_index: number
  case_uid: string
  relation: string
  relation_name: string
  timing: string
  timing_name: string
  source_kind: string
  source_locator: string
  source_text: string
  note: string
  printed_label: string
  case_title: string
}

export type RuleHoldout = {
  holdout_index: number
  case_uid: string
}
