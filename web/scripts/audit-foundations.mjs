import {
  BRANCH_RELATION_GROUPS,
  FOUNDATION_QUIZ_GROUPS,
  FOUNDATION_QUIZ_QUESTIONS,
  HIDDEN_STEMS,
  NAYIN,
  RELATION_QUIZ_QUESTIONS,
  STEM_BASICS,
  STEM_RELATION_GROUPS,
  detectChartRelations,
  majorShenshaFor,
  summarizeChartFoundations,
  tenGodFor,
} from '../src/foundations.ts'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const stems = '甲乙丙丁戊己庚辛壬癸'
const branches = '子丑寅卯辰巳午未申酉戌亥'
const cycle = new Set(Array.from({ length: 60 }, (_, index) => stems[index % 10] + branches[index % 12]))

assert(STEM_BASICS.map((item) => `${item.stem}${item.polarity}${item.element}`).join('|') === '甲阳木|乙阴木|丙阳火|丁阴火|戊阳土|己阴土|庚阳金|辛阴金|壬阳水|癸阴水', '十天干阴阳五行表不一致。')
assert(HIDDEN_STEMS.map((item) => `${item.branch}:${item.stems.join('')}`).join('|') === '子:癸|丑:己癸辛|寅:甲丙戊|卯:乙|辰:戊乙癸|巳:丙戊庚|午:丁己|未:己丁乙|申:庚壬戊|酉:辛|戌:戊辛丁|亥:壬甲', '十二地支藏干表不一致。')

const expectedNayin = [
  '甲子乙丑:海中金', '丙寅丁卯:炉中火', '戊辰己巳:大林木', '庚午辛未:路旁土', '壬申癸酉:剑锋金',
  '甲戌乙亥:山头火', '丙子丁丑:涧下水', '戊寅己卯:城头土', '庚辰辛巳:白蜡金', '壬午癸未:杨柳木',
  '甲申乙酉:泉中水', '丙戌丁亥:屋上土', '戊子己丑:霹雳火', '庚寅辛卯:松柏木', '壬辰癸巳:长流水',
  '甲午乙未:沙中金', '丙申丁酉:山下火', '戊戌己亥:平地木', '庚子辛丑:壁上土', '壬寅癸卯:金箔金',
  '甲辰乙巳:覆灯火', '丙午丁未:天河水', '戊申己酉:大驿土', '庚戌辛亥:钗钏金', '壬子癸丑:桑柘木',
  '甲寅乙卯:大溪水', '丙辰丁巳:沙中土', '戊午己未:天上火', '庚申辛酉:石榴木', '壬戌癸亥:大海水',
]
assert(NAYIN.map((item) => `${item.pillars.join('')}:${item.name}`).join('|') === expectedNayin.join('|'), '六十甲子纳音表不一致。')
const nayinPillars = NAYIN.flatMap((item) => item.pillars)
assert(nayinPillars.length === 60 && new Set(nayinPillars).size === 60 && nayinPillars.every((pillar) => cycle.has(pillar)), '纳音表必须无重复覆盖全部六十甲子。')

const expectedTenGodRows = [
  '比肩劫财食神伤官偏财正财七杀正官偏印正印',
  '劫财比肩伤官食神正财偏财正官七杀正印偏印',
  '偏印正印比肩劫财食神伤官偏财正财七杀正官',
  '正印偏印劫财比肩伤官食神正财偏财正官七杀',
  '七杀正官偏印正印比肩劫财食神伤官偏财正财',
  '正官七杀正印偏印劫财比肩伤官食神正财偏财',
  '偏财正财七杀正官偏印正印比肩劫财食神伤官',
  '正财偏财正官七杀正印偏印劫财比肩伤官食神',
  '食神伤官偏财正财七杀正官偏印正印比肩劫财',
  '伤官食神正财偏财正官七杀正印偏印劫财比肩',
]
for (const [dayIndex, dayStem] of [...stems].entries()) {
  assert([...stems].map((otherStem) => tenGodFor(dayStem, otherStem)).join('') === expectedTenGodRows[dayIndex], `${dayStem}日主十神映射不一致。`)
}

const relationMembers = new Map([...STEM_RELATION_GROUPS, ...BRANCH_RELATION_GROUPS].map((group) => [group.id, group.entries.map((entry) => entry.members).join('|')]))
const expectedRelations = {
  'stem-combinations': '甲—己|乙—庚|丙—辛|丁—壬|戊—癸',
  'stem-oppositions': '甲—庚|乙—辛|丙—壬|丁—癸',
  'branch-six-combinations': '子—丑|寅—亥|卯—戌|辰—酉|巳—申|午—未',
  'branch-three-combinations': '申—子—辰|亥—卯—未|寅—午—戌|巳—酉—丑',
  'branch-three-meetings': '寅—卯—辰|巳—午—未|申—酉—戌|亥—子—丑',
  'branch-six-clashes': '子—午|丑—未|寅—申|卯—酉|辰—戌|巳—亥',
  'branch-punishments': '寅—巳—申|丑—戌—未|子—卯|辰—辰／午—午／酉—酉／亥—亥',
  'branch-six-harms': '子—未|丑—午|寅—巳|卯—辰|申—亥|酉—戌',
  'branch-six-breaks': '子—酉|丑—辰|寅—亥|卯—午|巳—申|未—戌',
}
for (const [id, members] of Object.entries(expectedRelations)) assert(relationMembers.get(id) === members, `${id} 关系表不一致。`)

assert(new Set(RELATION_QUIZ_QUESTIONS.map((item) => item.id)).size === RELATION_QUIZ_QUESTIONS.length, '关系选择题 ID 必须唯一。')
assert(RELATION_QUIZ_QUESTIONS.every((item) => item.options.includes(item.answer) && item.options.length === 4), '关系选择题必须有四个选项且包含答案。')
assert(FOUNDATION_QUIZ_GROUPS.map((group) => `${group.id}:${group.questions.length}`).join('|') === 'hidden:12|nayin:30|relations:9', '基础选择题应包含 12 道藏干、30 道纳音和 9 道地支关系题。')
assert(FOUNDATION_QUIZ_QUESTIONS.length === 51 && new Set(FOUNDATION_QUIZ_QUESTIONS.map((item) => item.id)).size === 51, '基础选择题必须有 51 个唯一 ID。')
assert(FOUNDATION_QUIZ_QUESTIONS.every((item) => item.options.length === 4 && new Set(item.options).size === 4 && item.options.includes(item.answer)), '基础选择题必须有四个不重复选项且包含答案。')

const sample = { year_pillar: '乙未', month_pillar: '丙戌', day_pillar: '甲申', hour_pillar: '庚午' }
const summary = summarizeChartFoundations(sample)
assert(summary.dayMaster.stem === '甲' && summary.monthBranch.hiddenStems.join('') === '戊辛丁' && summary.dayBranch.hiddenStems.join('') === '庚壬戊' && summary.dayNayin === '泉中水', '例1基础拆解不一致。')
assert(summary.visibleTenGods.map((item) => `${item.stem}${item.tenGod}`).join('|') === '乙劫财|丙食神|庚七杀', '例1明透十神不一致。')
assert(majorShenshaFor('甲', '申', '丑').map((item) => item.name).join('|') === '天乙', '甲日见丑应识别天乙。')
assert(majorShenshaFor('甲', '申', '寅').map((item) => item.name).join('|') === '禄神|驿马', '甲日申支组见寅应识别禄神与驿马。')

const types = (chart) => detectChartRelations(chart).map((item) => item.type)
assert(types({ year_pillar: '甲子', month_pillar: '己午', day_pillar: '丙寅', hour_pillar: '丁戌' }).includes('天干五合'), '应识别甲己天干五合。')
assert(types({ year_pillar: '甲子', month_pillar: '乙午', day_pillar: '丙寅', hour_pillar: '丁戌' }).includes('地支六冲'), '应识别子午六冲。')
assert(types({ year_pillar: '甲寅', month_pillar: '乙午', day_pillar: '丙戌', hour_pillar: '丁子' }).includes('地支三合'), '应识别寅午戌三合。')
assert(types({ year_pillar: '甲寅', month_pillar: '乙卯', day_pillar: '丙辰', hour_pillar: '丁子' }).includes('地支三会'), '应识别寅卯辰三会。')
assert(types({ year_pillar: '甲辰', month_pillar: '乙辰', day_pillar: '丙子', hour_pillar: '丁午' }).includes('地支相刑'), '应识别辰辰自刑。')

console.log('PASS  stems, hidden stems, nayin, and ten-god mappings')
console.log('PASS  stem/branch relation tables and relation quiz invariants')
console.log('PASS  51-question foundation library and major shensha mappings')
console.log('PASS  foundation summary and representative relation detection')
