export type BookGroup = '陆致极体系' | '古籍与校注' | '近现代参考'
export type BookLevel = '入门' | '进阶' | '研究' | '版本参考'

export type BookEntry = {
  id: string
  title: string
  subtitle?: string
  author: string
  group: BookGroup
  level: BookLevel
  order: number
  year?: string
  editionNote?: string
  note: string
  caution?: string
  topics: string[]
  aliases: string[]
  sourceUrl: string
  sourceLabel: string
}

export const BOOK_GROUPS: Array<{ id: BookGroup; description: string }> = [
  { id: '陆致极体系', description: '整理 15 项已核验书目；包含独著、合著，以及为说明源流而保留的早期本、增订本与新版合集。' },
  { id: '古籍与校注', description: '用于追溯概念和比较不同论法，不作为选择题答案来源。' },
  { id: '近现代参考', description: '观察近代作者如何整理古法、组织案例和转换语言。' },
]

export const REFERENCE_BOOKS: BookEntry[] = [
  {
    id: 'basic-course', title: '八字命理学基础教程', author: '陆致极', group: '陆致极体系', level: '入门', order: 1, year: '2016',
    note: '建立阴阳五行、十神、静态结构和基本分析视角，适合与基础表及案例选择题并行。',
    topics: ['基础', '结构', '十神'], aliases: ['八字命理学基础教程', '八字命理學基礎教程', '基础教程', '基礎教程'],
    sourceUrl: 'https://play.google.com/store/books/details?id=gVPaDAAAQBAJ', sourceLabel: 'Google Play 书目信息',
  },
  {
    id: 'advanced-course', title: '八字命理学进阶教程', author: '陆致极', group: '陆致极体系', level: '进阶', order: 2, year: '2018',
    note: '在基础概念之后进入结构分析和具体操作。建议先完成入门题组，再围绕案例问题查阅。',
    topics: ['格局', '强弱', '调候', '形象'], aliases: ['八字命理学进阶教程', '八字命理學進階教程', '进阶教程', '進階教程'],
    sourceUrl: 'https://www.wanlibk.com/readers/preread/9789621466105.pdf', sourceLabel: '出版社试读',
  },
  {
    id: 'dynamic-course', title: '八字命理学动态分析教程', author: '陆致极', group: '陆致极体系', level: '进阶', order: 3, year: '2019',
    editionNote: '又称“高级教程”，与前两本构成原教程三部曲。',
    note: '聚焦原局与大运、流年的互动，适合在能稳定辨认命盘结构后学习。',
    topics: ['大运', '流年', '动态'], aliases: ['八字命理学动态分析教程', '八字命理學動態分析教程', '动态分析教程', '動態分析教程'],
    sourceUrl: 'https://www.sanmin.com.tw/product/index/007038807', sourceLabel: '三民书店出版信息',
  },
  {
    id: 'modern-outline', title: '现代八字命理学纲要', author: '陆致极', group: '陆致极体系', level: '研究', order: 4, year: '2020',
    note: '从现代研究框架重新组织命理知识，适合用于理解作者的整体方法论。',
    topics: ['方法论', '结构', '现代诠释'], aliases: ['现代八字命理学纲要', '現代八字命理學綱要'],
    sourceUrl: 'https://www.books.com.tw/products/0010855997', sourceLabel: '博客来出版信息',
  },
  {
    id: 'fine-stems', title: '细理干支', subtitle: '六十日柱新探', author: '陆致极', group: '陆致极体系', level: '进阶', order: 5, year: '2024',
    note: '从纳音象的历史演变进入六十日柱干支象，适合在能熟练辨认四柱后做日柱专题阅读。',
    caution: '书中的日柱描写用于建立观察维度，不应越过全盘结构直接套到个人。',
    topics: ['纳音', '六十日柱', '干支象'], aliases: ['细理干支', '細理干支', '六十日柱新探'],
    sourceUrl: 'https://www.sanmin.com.tw/product/index/013012464', sourceLabel: '三民书店出版信息',
  },
  {
    id: 'ancient-method-outline', title: '古法论命纲要', author: '陆致极', group: '陆致极体系', level: '研究', order: 6, year: '2024',
    note: '按文献年代评述十部古法典籍的背景、主要思想和关键文字，适合追溯古法而非直接背断语。',
    topics: ['古法', '典籍提要', '文献史'], aliases: ['古法论命纲要', '古法論命綱要'],
    sourceUrl: 'https://www.sanmin.com.tw/product/index/013286100', sourceLabel: '三民书店出版信息',
  },
  {
    id: 'destiny-search', title: '命运的求索', subtitle: '中国命理学简史及推演方法', author: '陆致极', group: '陆致极体系', level: '研究', order: 7, year: '2014／2015',
    editionNote: '简体本题名《命运的求索》，繁体本常题作《中国命理学简史及推演方法》；2023 年有再版。',
    note: '以较短篇幅梳理历史线索和推演方法，适合形成案例学习框架之后阅读。',
    topics: ['简史', '推演方法'], aliases: ['命运的求索', '命運的求索'],
    sourceUrl: 'https://opac.uibe.edu.cn/opac/book/627b281fa2fd61dafbc80d7a4b926803', sourceLabel: '高校图书馆书目',
  },
  {
    id: 'history', title: '中国命理学史论', subtitle: '一种历史文化现象的研究', author: '陆致极', group: '陆致极体系', level: '研究', order: 8, year: '2008',
    note: '偏学术史和文化研究，可用于核对概念来源、历史分期与文献脉络。',
    topics: ['史论', '文献', '文化研究'], aliases: ['中国命理学史论', '中國命理學史論'],
    sourceUrl: 'https://books.google.com/books/about/%E4%B8%AD%E5%9C%8B%E5%91%BD%E7%90%86%E5%AD%B8%E5%8F%B2%E8%AB%96.html?id=fsIQAQAAMAAJ', sourceLabel: 'Google Books 书目',
  },
  {
    id: 'selected-essays', title: '命学撷英', subtitle: '陆致极八字命理论集', author: '陆致极', group: '陆致极体系', level: '研究', order: 9, year: '2022',
    note: '论集型阅读，适合围绕结构、强弱、调候、格局和形象等主题按篇选读。',
    topics: ['论集', '结构', '方法'], aliases: ['命学撷英', '命學擷英'],
    sourceUrl: 'https://books.google.com/books/about/%E5%91%BD%E5%AD%B8%E6%93%B7%E8%8B%B1_%E9%99%B8%E8%87%B4%E6%A5%B5%E5%85%AB%E5%AD%97%E5%91%BD%E7%90%86%E8%AB%96%E9%9B%86.html?id=roKkEAAAQBAJ', sourceLabel: 'Google Books 书目',
  },
  {
    id: 'bazi-new-theory', title: '八字命理新论', author: '陆致极', group: '陆致极体系', level: '版本参考', order: 10, year: '1996',
    editionNote: '作者早期独立著作；后经增订形成《八字与中国智慧》。',
    note: '用于观察作者体系的早期形态。若已有增订本，不必只为内容完整而重复购买。',
    topics: ['早期体系', '版本源流'], aliases: ['八字命理新论', '八字命理新論'],
    sourceUrl: 'https://www.books.com.tw/products/0010122247', sourceLabel: '博客来书目信息',
  },
  {
    id: 'chinese-wisdom', title: '八字与中国智慧', author: '陆致极', group: '陆致极体系', level: '版本参考', order: 11, year: '1998（2010版可见）',
    editionNote: '《八字命理新论》的增订本。',
    note: '从文化背景、哲学基础与系统论角度组织八字结构，可用于观察作者早期体系如何扩展。',
    topics: ['早期体系', '系统论', '版本'], aliases: ['八字与中国智慧', '八字與中國智慧'],
    sourceUrl: 'https://www.sanmin.com.tw/product/index/000129240', sourceLabel: '三民书店版本信息',
  },
  {
    id: 'another-gene', title: '又一种“基因”的探索', author: '陆致极、陈致极', group: '陆致极体系', level: '研究', order: 12, year: '2012',
    editionNote: '作者健康相关研究的第一部研究手记。',
    note: '记录出生时间与体质相关性的早期案例、计量分析和研究过程，适合从研究设计与证据边界角度阅读。',
    caution: '这是相关性研究手记，不是医学诊断工具；个人健康问题应以正规医学检查为准。',
    topics: ['体质研究', '统计', '研究手记'], aliases: ['又一种基因的探索', '又一種基因的探索', '又一种“基因”的探索', '又一種「基因」的探索'],
    sourceUrl: 'https://books.google.com/books/about/%E5%8F%88%E4%B8%80%E7%A7%8D_%E5%9F%BA%E5%9B%A0_%E7%9A%84%E6%8E%A2%E7%B4%A2.html?id=N382MwEACAAJ', sourceLabel: 'Google Books 书目',
  },
  {
    id: 'health-code', title: '解读时空“基因”密码', subtitle: '疾病有数', author: '陆致极', group: '陆致极体系', level: '研究', order: 13, year: '2017',
    editionNote: '简体版题作《解读时空基因密码：轻松知道你的先天体质》（2021）。',
    note: '在前作基础上扩大案例并讨论出生时间结构与先天体质类型的统计关联。',
    caution: '不能据此诊断、排除或治疗疾病；请把它作为方法与统计主张的研究材料。',
    topics: ['先天体质', '统计关联', '健康研究'], aliases: ['解读时空基因密码', '解讀時空基因密碼', '疾病有数', '疾病有數', '轻松知道你的先天体质', '輕鬆知道你的先天體質'],
    sourceUrl: 'https://www.wanlibk.com/readers/preread/9789621463029.pdf', sourceLabel: '出版社试读',
  },
  {
    id: 'disease-early', title: '疾病早知道', subtitle: '再探时空“基因”密码', author: '陆致极', group: '陆致极体系', level: '研究', order: 14, year: '2019',
    editionNote: '简体版题作《解读时空基因密码·续集：疾病早知道》（2020）。',
    note: '延续体质研究，以常见病和部分癌症案例讨论出生时空结构与疾病之间的统计相关性。',
    caution: '相关性不等于因果，也不能用于个人疾病预测；现实健康决策必须由医疗专业人员和检查结果支持。',
    topics: ['疾病相关性', '统计模型', '健康研究'], aliases: ['疾病早知道', '再探时空基因密码', '再探時空基因密碼', '解读时空基因密码续集', '解讀時空基因密碼續集'],
    sourceUrl: 'https://www.sanmin.com.tw/product/index/013473054', sourceLabel: '三民书店出版信息',
  },
  {
    id: 'revised-course-2025', title: '八字命理学教程（上、下）', subtitle: '基础篇 / 实务篇', author: '陆致极', group: '陆致极体系', level: '版本参考', order: 15, year: '2025',
    editionNote: '《基础教程》（2016）与《进阶教程》（2018）重新修订后的两卷本合集。',
    note: '基础教程与进阶教程重新修订后的合集版本，适合希望按新版体系连续阅读的人。',
    caution: '与前三本系列教程内容有重叠，不必为了“集齐”而重复购买。',
    topics: ['新版', '基础', '实务'], aliases: ['八字命理学教程上', '八字命理學教程上', '八字命理学教程下', '八字命理學教程下', '基础篇', '基礎篇', '实务篇', '實務篇'],
    sourceUrl: 'https://www.sanmin.com.tw/product/index/014127361', sourceLabel: '2025 版出版信息',
  },
  {
    id: 'yuanhai-ziping', title: '渊海子平', author: '徐大升编', group: '古籍与校注', level: '研究', order: 1,
    note: '子平文献的重要汇编，适合用来追溯术语和早期论法，不宜直接当现代入门教材。',
    topics: ['子平法', '古籍', '术语'], aliases: ['渊海子平', '淵海子平'],
    sourceUrl: 'https://books.google.com/books/about/%E6%B7%B5%E6%B5%B7%E5%AD%90%E5%B9%B3.html?id=Ez2TCgAAQBAJ', sourceLabel: 'Google Books 书目',
  },
  {
    id: 'sanming-tonghui', title: '三命通会', author: '万民英', group: '古籍与校注', level: '研究', order: 2,
    note: '体量较大的综合性命理文献，可按主题查询，不建议从头通读作为第一本书。',
    topics: ['汇编', '古法', '案例'], aliases: ['三命通会', '三命通會'],
    sourceUrl: 'https://books.google.com/books/about/%E4%B8%89%E5%91%BD%E9%80%9A%E6%9C%83.html?id=KOhx0AEACAAJ', sourceLabel: 'Google Books 书目',
  },
  {
    id: 'wuxing-jingji', title: '五行精纪', author: '廖中', group: '古籍与校注', level: '研究', order: 3,
    note: '保存唐宋禄命资料的重要文献，适合做历史和概念源流研究。',
    topics: ['唐宋文献', '五行', '禄命'], aliases: ['五行精纪', '五行精紀'],
    sourceUrl: 'https://books.google.com/books/about/%E4%BA%94%E8%A1%8C%E7%B2%BE%E7%B4%80.html?id=XgDxEAAAQBAJ', sourceLabel: 'Google Books 书目',
  },
  {
    id: 'ziping-zhenquan', title: '子平真诠评注', author: '沈孝瞻原著，徐乐吾评注', group: '古籍与校注', level: '进阶', order: 4,
    note: '围绕月令、格局和用神展开。阅读时应区分原文与评注，并与实际案例交叉核对。',
    caution: '不同版本和注家解释差异较大，页面不把任何一种注法设为唯一标准。',
    topics: ['月令', '格局', '用神'], aliases: ['子平真诠', '子平真詮', '子平真诠评注', '子平真詮評註'],
    sourceUrl: 'https://books.google.com/books/about/%E5%AD%90%E5%B9%B3%E7%9C%9F%E8%AF%A0%E8%AF%84%E6%B3%A8.html?id=W2Ic0AEACAAJ', sourceLabel: 'Google Books 书目',
  },
  {
    id: 'ditiansui', title: '滴天髓阐微', author: '任铁樵注，袁树珊整理', group: '古籍与校注', level: '进阶', order: 5,
    note: '以短篇原文配注解和命例，适合练习结构理解，但应保留版本意识。',
    topics: ['旺衰', '干支', '命例'], aliases: ['滴天髓', '滴天髓阐微', '滴天髓闡微', '滴天髓征义', '滴天髓徵義'],
    sourceUrl: 'https://books.google.com/books?id=_ArTAAAAMAAJ', sourceLabel: 'Google Books 书目',
  },
  {
    id: 'qiongtong-baojian', title: '穷通宝鉴评注', author: '余春台整理，徐乐吾评注', group: '古籍与校注', level: '进阶', order: 6,
    note: '以日主和月令讨论调候，适合在理解五行生克后做专题对照。',
    topics: ['调候', '月令', '五行'], aliases: ['穷通宝鉴', '窮通寶鑑', '穷通宝鉴评注', '窮通寶鑑評註'],
    sourceUrl: 'https://ndlsearch.ndl.go.jp/books/R100000136-I1970304959960755998', sourceLabel: '国立国会图书馆书目',
  },
  {
    id: 'qianli-minggao', title: '千里命稿', author: '韦千里', group: '近现代参考', level: '进阶', order: 1,
    note: '近代命理讲义与案例材料，可用于比较近现代的表达、分类和实务组织方式。',
    topics: ['近代', '讲义', '案例'], aliases: ['千里命稿', '千里命稿第一集'],
    sourceUrl: 'https://books.google.com/books/about/%E5%8D%83%E9%87%8C%E5%91%BD%E7%A8%BF.html?id=0NRnAgAAQBAJ', sourceLabel: 'Google Books 书目',
  },
  {
    id: 'mingli-tanyuan', title: '新命理探原', author: '袁树珊', group: '近现代参考', level: '研究', order: 2,
    note: '近代整理型著作，适合研究术语、体系化表达和民国时期的命理知识组织。',
    topics: ['近代', '体系', '术语'], aliases: ['新命理探原', '新命理探源', '命理探原', '命理探源'],
    sourceUrl: 'https://books.google.com/books?id=k_meAwAAQBAJ&printsec=frontcover', sourceLabel: 'Google Books 书目',
  },
]

function normalizeBookName(value: string) {
  return value.replace(/[\s_《》【】\[\]()（）·.，,：:;；/\\-]/g, '').toLowerCase()
}

export function matchLocalBook(filename: string, book: BookEntry) {
  const normalized = normalizeBookName(filename)
  return book.aliases.some((alias) => normalized.includes(normalizeBookName(alias)))
}
