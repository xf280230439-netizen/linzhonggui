import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const projectRoot = fileURLToPath(new URL('..', import.meta.url))
const viteCli = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))
const port = 4183
const base = `http://127.0.0.1:${port}/`

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function waitForServer(process) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (process.exitCode !== null) throw new Error(`预览服务提前退出，代码 ${process.exitCode}`)
    try {
      const response = await fetch(base)
      if (response.ok) return
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error('等待本地预览服务超时。')
}

async function putRecord(page, record) {
  await page.evaluate((nextRecord) => new Promise((resolve, reject) => {
    const request = indexedDB.open('zhou-study-local', 1)
    request.onsuccess = () => {
      const db = request.result
      const transaction = db.transaction('records', 'readwrite')
      transaction.objectStore('records').put(nextRecord)
      transaction.oncomplete = () => { db.close(); resolve() }
      transaction.onerror = () => reject(transaction.error)
    }
    request.onerror = () => reject(request.error)
  }), record)
}

const preview = spawn(process.execPath, [viteCli, 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  cwd: projectRoot,
  stdio: 'ignore',
})

let browser
try {
  await waitForServer(preview)
  browser = await chromium.launch({ channel: 'msedge', headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`) })
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`))

  await page.goto(base)
  await page.locator('.app-shell').waitFor({ timeout: 30_000 })

  await page.goto(`${base}#/case/Z001`)
  await page.locator('.chart-foundations').waitFor()
  assert(await page.locator('.chart-foundations').count() === 1, '普通案例应显示基础拆解。')
  assert(await page.locator('.chart-relations').count() === 1, '普通案例应显示关系提示。')

  await page.goto(`${base}#/training-card/Z001`)
  await page.locator('.chart-board').waitFor()
  assert(await page.locator('.chart-foundations,.chart-relations').count() === 0, '深度训练不应事前显示提示。')

  const caseReview = { id: 'case:Z002', kind: 'case', caseUid: 'Z002', body: 'review note', completed: true, updatedAt: new Date().toISOString() }
  await putRecord(page, { ...caseReview, nextReviewAt: '2026-01-01T00:00:00.000Z' })
  await page.reload()
  await page.locator('.app-shell').waitFor()
  await page.goto(base)
  await page.locator('.hero-panel button').first().click()
  await page.locator('.chart-board').waitFor()
  assert(new URL(page.url()).hash.startsWith('#/practice/Z002/review-'), '到期复习应进入独立练习而不是直接看原文。')
  assert(await page.locator('.chart-foundations,.chart-relations').count() === 0, '到期复习在揭示前不应显示提示。')
  await putRecord(page, { ...caseReview, nextReviewAt: '2099-01-01T00:00:00.000Z' })

  const recordBase = { id: 'quiz:Z001', kind: 'quiz', caseUid: 'Z001', completed: true, updatedAt: new Date().toISOString() }
  await putRecord(page, {
    ...recordBase,
    body: JSON.stringify({ 'day-stem': 'old', 'hidden-stems': 'old', nayin: 'old', method: 'old' }),
    quizScore: 4,
    quizTotal: 4,
  })
  await page.reload()
  await page.locator('.app-shell').waitFor()
  await page.goto(`${base}#/training/quiz`)
  const firstRow = page.locator('.list-row').first()
  await firstRow.waitFor()
  assert((await firstRow.innerText()).includes('4/5'), '旧四题记录应显示当前进度 4/5。')
  assert(await firstRow.locator('.row-index.complete').count() === 0, '旧四题记录不应误标为完成。')

  await putRecord(page, {
    ...recordBase,
    body: JSON.stringify({ 'day-stem': 'wrong', 'hidden-stems': 'wrong', nayin: 'wrong', 'chart-relation': 'wrong', method: 'wrong' }),
    quizScore: 0,
    quizTotal: 5,
  })
  await page.reload()
  await page.locator('.app-shell').waitFor()
  await page.goto(base)
  await page.locator('.hero-panel').waitFor()
  await page.locator('.hero-panel button').first().click()
  await page.locator('.quiz-question').first().waitFor()
  assert(new URL(page.url()).hash === '#/quiz/Z001/wrong', '今日学习应在新案例前优先处理错题。')
  await page.goto(`${base}#/training/quiz`)
  await page.locator('.quiz-diagnostics').waitFor()
  await page.locator('.quiz-scope-tabs button').nth(2).click()
  await page.locator('.list-row').first().click()
  await page.locator('.quiz-question').first().waitFor()
  assert(new URL(page.url()).hash === '#/quiz/Z001/wrong', '待复习应直接进入错题重做。')
  assert(await page.locator('.quiz-question').count() === 5, '五个错项应只显示五道错题。')
  assert(await page.locator('.chart-foundations,.chart-relations').count() === 0, '错题重做不应显示答案提示。')

  await page.goto(base)
  await page.locator('.app-shell').waitFor()
  await page.locator('button[aria-label="打开设置"]').click()
  const settings = page.locator('[role="dialog"]')
  await settings.waitFor()
  const backupInput = settings.locator('input[accept*="json"]')
  await backupInput.setInputFiles({
    name: 'legacy-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      format: 'zhou-study-notes',
      records: [{ id: 'practice:backup-smoke', kind: 'practice', caseUid: 'Z003', body: 'smoke', completed: false, updatedAt: new Date().toISOString() }],
    })),
  })
  await page.waitForFunction(() => document.querySelector('.inline-message')?.textContent?.includes('已导入 1 条'))
  const downloadPromise = page.waitForEvent('download')
  await settings.getByRole('button', { name: '导出备份' }).click()
  const download = await downloadPromise
  assert(download.suggestedFilename().startsWith('linzhonggui-学习记录-'), '备份文件名应使用 linzhonggui。')
  const downloadPath = await download.path()
  assert(downloadPath, '备份下载应生成本地文件。')
  const exported = JSON.parse(await readFile(downloadPath, 'utf8'))
  assert(exported.format === 'linzhonggui-notes', '新备份应使用 linzhonggui 格式标识。')
  assert(exported.records.some((record) => record.id === 'practice:backup-smoke'), '导入记录应能再次完整导出。')
  await backupInput.setInputFiles({
    name: 'broken-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ format: 'linzhonggui-notes', records: [{ id: 'broken', caseUid: 'Z003', body: 'smoke', updatedAt: new Date().toISOString() }] })),
  })
  await page.waitForFunction(() => document.querySelector('.inline-message')?.textContent?.includes('kind 无效'))
  await settings.getByRole('button', { name: '完成' }).click()

  const routeChecks = [
    ['#/home', '.hero-panel'],
    ['#/training/quiz', '.quiz-catalog'],
    ['#/training/foundations', '.foundation-stack'],
    ['#/training/workflows/marriage', '.workflow-reference'],
    ['#/training/advanced', '.advanced-training'],
    ['#/cases', '.search-page'],
    ['#/library', '.library-page'],
    ['#/rules', '.family-section'],
    ['#/rule/R001', '.rule-hero'],
    ['#/case/Z001', '.case-hero'],
    ['#/quiz/Z001', '.quiz-page'],
    ['#/training-card/Z001', '.detail-page'],
    ['#/practice/Z001/smoke-route', '.blind-banner'],
    ['#/blind/R001/Z007', '.blind-banner'],
  ]
  for (const [hash, selector] of routeChecks) {
    await page.goto(`${base}${hash}`)
    const content = page.locator(selector)
    await content.first().waitFor()
    assert((await content.first().innerText()).trim().length > 10, `${hash} 应渲染有效内容。`)
    assert(await page.locator('.empty-state').count() === 0, `${hash} 不应进入未找到状态。`)
  }

  await page.setViewportSize({ width: 390, height: 844 })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  assert(overflow === 0, `移动端横向溢出 ${overflow}px。`)
  assert(errors.length === 0, `浏览器错误：${errors.join(' | ')}`)

  console.log('PASS  database auto-load')
  console.log('PASS  normal chart hints, masked training, and due-review boundary')
  console.log('PASS  legacy 4/5 progress migration')
  console.log('PASS  direct mistake-only retry')
  console.log('PASS  backup export, legacy import, and malformed-record rejection')
  console.log('PASS  all primary, learning, practice, and rule routes')
  console.log('PASS  390px mobile layout and browser console')
} finally {
  if (browser) await browser.close()
  preview.kill()
}
