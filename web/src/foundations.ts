export type HiddenStemEntry = {
  branch: string
  stems: string[]
}

export type NayinEntry = {
  pillars: [string, string]
  name: string
}

export type StemBasic = {
  stem: string
  element: '木' | '火' | '土' | '金' | '水'
  polarity: '阳' | '阴'
}

export type RelationEntry = {
  members: string
  result?: string
}

export type RelationGroup = {
  id: string
  title: string
  description: string
  entries: RelationEntry[]
  boundary: string
}

export type RelationQuizQuestion = {
  id: string
  category: string
  prompt: string
  options: string[]
  answer: string
  explanation: string
}

export const STEM_BASICS: StemBasic[] = [
  { stem: '甲', element: '木', polarity: '阳' },
  { stem: '乙', element: '木', polarity: '阴' },
  { stem: '丙', element: '火', polarity: '阳' },
  { stem: '丁', element: '火', polarity: '阴' },
  { stem: '戊', element: '土', polarity: '阳' },
  { stem: '己', element: '土', polarity: '阴' },
  { stem: '庚', element: '金', polarity: '阳' },
  { stem: '辛', element: '金', polarity: '阴' },
  { stem: '壬', element: '水', polarity: '阳' },
  { stem: '癸', element: '水', polarity: '阴' },
]

export const HIDDEN_STEMS: HiddenStemEntry[] = [
  { branch: '子', stems: ['癸'] },
  { branch: '丑', stems: ['己', '癸', '辛'] },
  { branch: '寅', stems: ['甲', '丙', '戊'] },
  { branch: '卯', stems: ['乙'] },
  { branch: '辰', stems: ['戊', '乙', '癸'] },
  { branch: '巳', stems: ['丙', '戊', '庚'] },
  { branch: '午', stems: ['丁', '己'] },
  { branch: '未', stems: ['己', '丁', '乙'] },
  { branch: '申', stems: ['庚', '壬', '戊'] },
  { branch: '酉', stems: ['辛'] },
  { branch: '戌', stems: ['戊', '辛', '丁'] },
  { branch: '亥', stems: ['壬', '甲'] },
]

export const STEM_RELATION_GROUPS: RelationGroup[] = [
  {
    id: 'stem-combinations',
    title: '天干五合',
    description: '五组阴阳相配，传统上各有合化五行。',
    entries: [
      { members: '甲—己', result: '合土' },
      { members: '乙—庚', result: '合金' },
      { members: '丙—辛', result: '合水' },
      { members: '丁—壬', result: '合木' },
      { members: '戊—癸', result: '合火' },
    ],
    boundary: '先记配对。“有合”不等于“已经化”，是否合化仍要看季节、位置、透藏与全局。',
  },
  {
    id: 'stem-oppositions',
    title: '四组相克',
    description: '部分命理体系称为“天干四冲”，基础层先按五行相克理解。',
    entries: [
      { members: '甲—庚', result: '金克木' },
      { members: '乙—辛', result: '金克木' },
      { members: '丙—壬', result: '水克火' },
      { members: '丁—癸', result: '水克火' },
    ],
    boundary: '天干没有通行的刑、害、破配对表；本页也不把天干相克与地支六冲机械等同。',
  },
]

export const BRANCH_RELATION_GROUPS: RelationGroup[] = [
  {
    id: 'branch-six-combinations',
    title: '地支六合',
    description: '六组两支相合，并有传统五行配属。',
    entries: [
      { members: '子—丑', result: '合土' },
      { members: '寅—亥', result: '合木' },
      { members: '卯—戌', result: '合火' },
      { members: '辰—酉', result: '合金' },
      { members: '巳—申', result: '合水' },
      { members: '午—未', result: '合土' },
    ],
    boundary: '六合先作为结构关系识别；合而不化、合绊或解冲，要回到具体命局判断。',
  },
  {
    id: 'branch-three-combinations',
    title: '地支三合',
    description: '三支组成四组五行局。',
    entries: [
      { members: '申—子—辰', result: '水局' },
      { members: '亥—卯—未', result: '木局' },
      { members: '寅—午—戌', result: '火局' },
      { members: '巳—酉—丑', result: '金局' },
    ],
    boundary: '三支齐全是基础识别条件；是否成局、力量多大，不能只看名称。',
  },
  {
    id: 'branch-three-meetings',
    title: '地支三会',
    description: '按季节方位组成四组方局。',
    entries: [
      { members: '寅—卯—辰', result: '东方木' },
      { members: '巳—午—未', result: '南方火' },
      { members: '申—酉—戌', result: '西方金' },
      { members: '亥—子—丑', result: '北方水' },
    ],
    boundary: '会齐只说明同方之气集中，仍需结合月令、透干和是否受制。',
  },
  {
    id: 'branch-six-clashes',
    title: '地支六冲',
    description: '十二地支相隔六位形成六组相冲。',
    entries: [
      { members: '子—午' },
      { members: '丑—未' },
      { members: '寅—申' },
      { members: '卯—酉' },
      { members: '辰—戌' },
      { members: '巳—亥' },
    ],
    boundary: '冲表示结构发生牵动或对立，不自动等于凶；要看冲到什么、谁有力、是否有解。',
  },
  {
    id: 'branch-punishments',
    title: '地支相刑',
    description: '常用表分为三组刑与四组自刑。',
    entries: [
      { members: '寅—巳—申', result: '无恩之刑' },
      { members: '丑—戌—未', result: '恃势之刑' },
      { members: '子—卯', result: '无礼之刑' },
      { members: '辰—辰／午—午／酉—酉／亥—亥', result: '自刑' },
    ],
    boundary: '不同传承对刑的成立顺序与轻重有差异；基础阶段只记组合，不先套事件。',
  },
  {
    id: 'branch-six-harms',
    title: '地支六害（穿）',
    description: '“害”在部分传承中也称“穿”。',
    entries: [
      { members: '子—未' },
      { members: '丑—午' },
      { members: '寅—巳' },
      { members: '卯—辰' },
      { members: '申—亥' },
      { members: '酉—戌' },
    ],
    boundary: '先把“害／穿”视作同一组配对名称；具体含义和权重必须以所学体系与案例反馈为准。',
  },
  {
    id: 'branch-six-breaks',
    title: '地支六破',
    description: '常用基础表中的六组相破。',
    entries: [
      { members: '子—酉' },
      { members: '丑—辰' },
      { members: '寅—亥' },
      { members: '卯—午' },
      { members: '巳—申' },
      { members: '未—戌' },
    ],
    boundary: '相破在不同学派中的使用权重差异较大，本工具只供识别，不设为稳定断语。',
  },
]

export const RELATION_QUIZ_QUESTIONS: RelationQuizQuestion[] = [
  {
    id: 'stem-heji', category: '天干五合', prompt: '甲与己相遇，基础关系表中属于哪一项？',
    options: ['天干五合', '地支六合', '地支六冲', '地支相刑'], answer: '天干五合',
    explanation: '甲己为天干五合之一，传统配属为合土。',
  },
  {
    id: 'stem-dingren', category: '天干五合', prompt: '丁壬五合的传统五行配属是什么？',
    options: ['木', '火', '土', '金'], answer: '木',
    explanation: '天干五合中，丁壬合木。记住配对后，还要区分“有合”与“合化成立”。',
  },
  {
    id: 'stem-boundary', category: '适用边界', prompt: '以下哪一类不属于通行的天干基础配对表？',
    options: ['五合', '五行相克', '六害（穿）', '部分体系所称四冲'], answer: '六害（穿）',
    explanation: '六害（穿）是地支关系。天干基础层以五合和生克为主。',
  },
  {
    id: 'branch-zi-chou', category: '地支六合', prompt: '子与丑是什么关系？',
    options: ['六合', '六冲', '六害', '六破'], answer: '六合',
    explanation: '子丑为六合，传统配属为合土。',
  },
  {
    id: 'branch-zi-wu', category: '地支六冲', prompt: '子与午是什么关系？',
    options: ['六合', '六冲', '三合', '相刑'], answer: '六冲',
    explanation: '子午相隔六位，属于地支六冲。',
  },
  {
    id: 'branch-water', category: '地支三合', prompt: '申、子、辰三支齐全，组成什么局？',
    options: ['水局', '木局', '火局', '金局'], answer: '水局',
    explanation: '申子辰为三合水局；“三支齐全”不等于可以跳过旺衰和全局条件。',
  },
  {
    id: 'branch-meeting', category: '地支三会', prompt: '寅、卯、辰组成哪一方的三会？',
    options: ['东方木', '南方火', '西方金', '北方水'], answer: '东方木',
    explanation: '寅卯辰为东方木，属于地支三会方局。',
  },
  {
    id: 'branch-harm', category: '六害（穿）', prompt: '子与未在部分传承中又称什么关系？',
    options: ['穿', '破', '冲', '自刑'], answer: '穿',
    explanation: '子未为六害之一；“害”在部分传承中也称“穿”。',
  },
  {
    id: 'branch-break', category: '地支六破', prompt: '子与酉属于哪种基础配对？',
    options: ['六破', '六合', '六冲', '三会'], answer: '六破',
    explanation: '常用六破表中包括子酉相破。不同学派对“破”的权重并不一致。',
  },
  {
    id: 'branch-punishment', category: '地支相刑', prompt: '子与卯属于哪组相刑？',
    options: ['无礼之刑', '无恩之刑', '恃势之刑', '自刑'], answer: '无礼之刑',
    explanation: '子卯相刑常称无礼之刑。基础阶段先识别组合，不直接套事件。',
  },
  {
    id: 'branch-self-punishment', category: '地支相刑', prompt: '命局中出现两个辰，基础关系表称为什么？',
    options: ['自刑', '六合', '六害', '三合'], answer: '自刑',
    explanation: '辰、午、酉、亥各自重复，在常用表中列为自刑。',
  },
  {
    id: 'relation-boundary', category: '学习方法', prompt: '识别出合、冲、刑、害或破以后，正确的下一步是什么？',
    options: ['继续看位置、旺衰与全局条件', '立即判断为吉', '立即判断为凶', '只按关系名称套事件'], answer: '继续看位置、旺衰与全局条件',
    explanation: '关系表解决的是“有没有结构关系”，不能单独完成吉凶或事件判断。',
  },
]

export type ChartPillars = {
  year_pillar: string
  month_pillar: string
  day_pillar: string
  hour_pillar: string
}

export type ChartFoundationSummary = {
  dayMaster: { stem: string; polarity: string; element: string }
  monthBranch: { branch: string; hiddenStems: string[] }
  dayBranch: { branch: string; hiddenStems: string[] }
  dayNayin: string
  visibleTenGods: Array<{ position: string; stem: string; tenGod: string }>
}

export type DetectedRelation = {
  id: string
  scope: '天干' | '地支'
  type: string
  members: string
  locations: string[]
  result?: string
  boundary: string
}

type SymbolPosition = {
  index: number
  stem: string
  branch: string
  stemLabel: string
  branchLabel: string
}

const RELATION_TYPE_NAMES: Record<string, string> = {
  'stem-combinations': '天干五合',
  'stem-oppositions': '天干相克',
  'branch-six-combinations': '地支六合',
  'branch-three-combinations': '地支三合',
  'branch-three-meetings': '地支三会',
  'branch-six-clashes': '地支六冲',
  'branch-punishments': '地支相刑',
  'branch-six-harms': '地支六害（穿）',
  'branch-six-breaks': '地支六破',
}

function chartPositions(chart: ChartPillars): SymbolPosition[] {
  const pillars = [
    ['年', chart.year_pillar],
    ['月', chart.month_pillar],
    ['日', chart.day_pillar],
    ['时', chart.hour_pillar],
  ] as const
  return pillars.flatMap(([label, pillar], index) => pillar?.length === 2 ? [{
    index,
    stem: pillar[0],
    branch: pillar[1],
    stemLabel: `${label}干${pillar[0]}`,
    branchLabel: `${label}支${pillar[1]}`,
  }] : [])
}

function samePair(first: string, second: string, members: string[]) {
  return members.length === 2 && ((first === members[0] && second === members[1]) || (first === members[1] && second === members[0]))
}

export function detectChartRelations(chart: ChartPillars): DetectedRelation[] {
  const positions = chartPositions(chart)
  const detected: DetectedRelation[] = []

  function addPairGroups(scope: '天干' | '地支', groups: RelationGroup[]) {
    const symbol = (position: SymbolPosition) => scope === '天干' ? position.stem : position.branch
    const label = (position: SymbolPosition) => scope === '天干' ? position.stemLabel : position.branchLabel
    for (const group of groups) {
      for (const entry of group.entries) {
        const members = entry.members.split('—')
        if (members.length !== 2 || members.some((item) => item.includes('／'))) continue
        for (let first = 0; first < positions.length; first += 1) {
          for (let second = first + 1; second < positions.length; second += 1) {
            if (!samePair(symbol(positions[first]), symbol(positions[second]), members)) continue
            const locations = [label(positions[first]), label(positions[second])]
            detected.push({
              id: `${scope}-${group.id}-${locations.join('-')}`,
              scope,
              type: RELATION_TYPE_NAMES[group.id] || group.title,
              members: entry.members,
              locations,
              result: entry.result,
              boundary: group.boundary,
            })
          }
        }
      }
    }
  }

  addPairGroups('天干', STEM_RELATION_GROUPS)
  addPairGroups('地支', BRANCH_RELATION_GROUPS.filter((group) => ['branch-six-combinations', 'branch-six-clashes', 'branch-six-harms', 'branch-six-breaks'].includes(group.id)))

  const punishmentGroup = BRANCH_RELATION_GROUPS.find((group) => group.id === 'branch-punishments')!
  const ziMao = punishmentGroup.entries.find((entry) => entry.members === '子—卯')!
  addPairGroups('地支', [{ ...punishmentGroup, entries: [ziMao] }])

  for (const group of BRANCH_RELATION_GROUPS.filter((item) => ['branch-three-combinations', 'branch-three-meetings', 'branch-punishments'].includes(item.id))) {
    for (const entry of group.entries) {
      const members = entry.members.split('—')
      if (members.length !== 3) continue
      if (!members.every((member) => positions.some((position) => position.branch === member))) continue
      const locations = positions.filter((position) => members.includes(position.branch)).map((position) => position.branchLabel)
      detected.push({
        id: `地支-${group.id}-${entry.members}`,
        scope: '地支',
        type: RELATION_TYPE_NAMES[group.id] || group.title,
        members: entry.members,
        locations,
        result: entry.result,
        boundary: group.boundary,
      })
    }
  }

  const selfPunishment = punishmentGroup.entries.find((entry) => entry.result === '自刑')!
  for (const branch of ['辰', '午', '酉', '亥']) {
    const matches = positions.filter((position) => position.branch === branch)
    if (matches.length < 2) continue
    detected.push({
      id: `地支-${punishmentGroup.id}-${branch}-self`,
      scope: '地支',
      type: RELATION_TYPE_NAMES[punishmentGroup.id],
      members: `${branch}—${branch}`,
      locations: matches.map((position) => position.branchLabel),
      result: '自刑',
      boundary: selfPunishment ? punishmentGroup.boundary : '',
    })
  }

  return detected
}

export const NAYIN: NayinEntry[] = [
  { pillars: ['甲子', '乙丑'], name: '海中金' },
  { pillars: ['丙寅', '丁卯'], name: '炉中火' },
  { pillars: ['戊辰', '己巳'], name: '大林木' },
  { pillars: ['庚午', '辛未'], name: '路旁土' },
  { pillars: ['壬申', '癸酉'], name: '剑锋金' },
  { pillars: ['甲戌', '乙亥'], name: '山头火' },
  { pillars: ['丙子', '丁丑'], name: '涧下水' },
  { pillars: ['戊寅', '己卯'], name: '城头土' },
  { pillars: ['庚辰', '辛巳'], name: '白蜡金' },
  { pillars: ['壬午', '癸未'], name: '杨柳木' },
  { pillars: ['甲申', '乙酉'], name: '泉中水' },
  { pillars: ['丙戌', '丁亥'], name: '屋上土' },
  { pillars: ['戊子', '己丑'], name: '霹雳火' },
  { pillars: ['庚寅', '辛卯'], name: '松柏木' },
  { pillars: ['壬辰', '癸巳'], name: '长流水' },
  { pillars: ['甲午', '乙未'], name: '沙中金' },
  { pillars: ['丙申', '丁酉'], name: '山下火' },
  { pillars: ['戊戌', '己亥'], name: '平地木' },
  { pillars: ['庚子', '辛丑'], name: '壁上土' },
  { pillars: ['壬寅', '癸卯'], name: '金箔金' },
  { pillars: ['甲辰', '乙巳'], name: '覆灯火' },
  { pillars: ['丙午', '丁未'], name: '天河水' },
  { pillars: ['戊申', '己酉'], name: '大驿土' },
  { pillars: ['庚戌', '辛亥'], name: '钗钏金' },
  { pillars: ['壬子', '癸丑'], name: '桑柘木' },
  { pillars: ['甲寅', '乙卯'], name: '大溪水' },
  { pillars: ['丙辰', '丁巳'], name: '沙中土' },
  { pillars: ['戊午', '己未'], name: '天上火' },
  { pillars: ['庚申', '辛酉'], name: '石榴木' },
  { pillars: ['壬戌', '癸亥'], name: '大海水' },
]

export function hiddenStemsFor(branchOrPillar: string) {
  const branch = branchOrPillar.slice(-1)
  return HIDDEN_STEMS.find((item) => item.branch === branch)?.stems || []
}

export function nayinFor(pillar: string) {
  return NAYIN.find((item) => item.pillars.includes(pillar))?.name || ''
}

export function tenGodFor(dayStem: string, otherStem: string) {
  const day = STEM_BASICS.find((item) => item.stem === dayStem)
  const other = STEM_BASICS.find((item) => item.stem === otherStem)
  if (!day || !other) return ''
  const elements: StemBasic['element'][] = ['木', '火', '土', '金', '水']
  const dayIndex = elements.indexOf(day.element)
  const otherIndex = elements.indexOf(other.element)
  const samePolarity = day.polarity === other.polarity
  if (otherIndex === dayIndex) return samePolarity ? '比肩' : '劫财'
  if (otherIndex === (dayIndex + 1) % 5) return samePolarity ? '食神' : '伤官'
  if (otherIndex === (dayIndex + 2) % 5) return samePolarity ? '偏财' : '正财'
  if (otherIndex === (dayIndex + 3) % 5) return samePolarity ? '七杀' : '正官'
  return samePolarity ? '偏印' : '正印'
}

export function summarizeChartFoundations(chart: ChartPillars): ChartFoundationSummary {
  const dayStem = chart.day_pillar?.[0] || ''
  const dayBranch = chart.day_pillar?.[1] || ''
  const monthBranch = chart.month_pillar?.[1] || ''
  const dayBasic = STEM_BASICS.find((item) => item.stem === dayStem)
  const visibleTenGods = [
    ['年干', chart.year_pillar?.[0] || ''],
    ['月干', chart.month_pillar?.[0] || ''],
    ['时干', chart.hour_pillar?.[0] || ''],
  ].map(([position, stem]) => ({ position, stem, tenGod: tenGodFor(dayStem, stem) })).filter((item) => item.stem && item.tenGod)
  return {
    dayMaster: { stem: dayStem, polarity: dayBasic?.polarity || '', element: dayBasic?.element || '' },
    monthBranch: { branch: monthBranch, hiddenStems: hiddenStemsFor(monthBranch) },
    dayBranch: { branch: dayBranch, hiddenStems: hiddenStemsFor(dayBranch) },
    dayNayin: nayinFor(chart.day_pillar),
    visibleTenGods,
  }
}
