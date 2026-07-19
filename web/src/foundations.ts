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
