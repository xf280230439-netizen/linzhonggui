import { BOOK_GROUPS, REFERENCE_BOOKS, matchLocalBook } from '../src/library.ts'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const ids = REFERENCE_BOOKS.map((book) => book.id)
assert(REFERENCE_BOOKS.length === 23 && new Set(ids).size === 23, '参考书架应包含 23 项唯一书目。')
assert(BOOK_GROUPS.length === 3, '参考书架应保留三个分组。')

const expectedCounts = { '陆致极体系': 15, '古籍与校注': 6, '近现代参考': 2 }
for (const [group, expected] of Object.entries(expectedCounts)) {
  const books = REFERENCE_BOOKS.filter((book) => book.group === group)
  assert(books.length === expected, `${group} 应有 ${expected} 项书目。`)
  assert(new Set(books.map((book) => book.order)).size === books.length, `${group} 的学习顺序不能重复。`)
}

assert(REFERENCE_BOOKS.every((book) => book.title && book.author && book.note && book.aliases.length && book.topics.length), '每项书目必须具有标题、作者、说明、别名和主题。')
assert(REFERENCE_BOOKS.every((book) => book.sourceUrl.startsWith('https://') && book.sourceLabel), '每项书目必须指向 HTTPS 核验来源。')
assert(new Set(REFERENCE_BOOKS.map((book) => book.sourceUrl)).size === REFERENCE_BOOKS.length, '书目来源链接不应重复。')

const versionReferences = REFERENCE_BOOKS.filter((book) => book.level === '版本参考')
assert(versionReferences.map((book) => book.id).join('|') === 'bazi-new-theory|chinese-wisdom|revised-course-2025', '版本参考条目不一致。')
assert(versionReferences.every((book) => book.editionNote), '版本参考必须说明版本关系。')

for (const id of ['another-gene', 'health-code', 'disease-early']) {
  const book = REFERENCE_BOOKS.find((item) => item.id === id)
  assert(book?.caution && /医学|医疗|诊断/.test(book.caution), `${id} 必须保留健康边界提醒。`)
}

const basic = REFERENCE_BOOKS.find((book) => book.id === 'basic-course')
assert(basic && matchLocalBook('陆致极《八字命理学基础教程》.pdf', basic), '本机书名应能匹配基础教程。')
assert(basic && !matchLocalBook('八字命理学进阶教程.pdf', basic), '本机书名不应误匹配其他教程。')

console.log('PASS  23 unique bibliography entries and group counts')
console.log('PASS  sources, version lineage, aliases, and health boundaries')
