import { spawn } from 'node:child_process'
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
  await page.locator('.quiz-diagnostics').waitFor()
  await page.locator('.quiz-scope-tabs button').nth(2).click()
  await page.locator('.list-row').first().click()
  await page.locator('.quiz-question').first().waitFor()
  assert(new URL(page.url()).hash === '#/quiz/Z001/wrong', '待复习应直接进入错题重做。')
  assert(await page.locator('.quiz-question').count() === 5, '五个错项应只显示五道错题。')
  assert(await page.locator('.chart-foundations,.chart-relations').count() === 0, '错题重做不应显示答案提示。')

  await page.setViewportSize({ width: 390, height: 844 })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  assert(overflow === 0, `移动端横向溢出 ${overflow}px。`)
  assert(errors.length === 0, `浏览器错误：${errors.join(' | ')}`)

  console.log('PASS  database auto-load')
  console.log('PASS  normal chart hints and masked-training boundary')
  console.log('PASS  legacy 4/5 progress migration')
  console.log('PASS  direct mistake-only retry')
  console.log('PASS  390px mobile layout and browser console')
} finally {
  if (browser) await browser.close()
  preview.kill()
}
