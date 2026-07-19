import { createHash } from 'node:crypto'
import { readdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(scriptDir, '..', 'dist')
const serviceWorkerPath = join(distDir, 'sw.js')
const indexPath = join(distDir, 'index.html')

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walk(path))
    else files.push(path)
  }
  return files
}

let html = await readFile(indexPath, 'utf8')
const scriptMatch = html.match(/<script type="module" crossorigin src="\.\/(assets\/[^"]+\.js)"><\/script>/)
const styleMatch = html.match(/<link rel="stylesheet" crossorigin href="\.\/(assets\/[^"]+\.css)">/)

if (!scriptMatch || !styleMatch) throw new Error('Could not find Vite entry assets in dist/index.html')

const scriptPath = join(distDir, scriptMatch[1])
const stylePath = join(distDir, styleMatch[1])
let script = await readFile(scriptPath, 'utf8')
const style = await readFile(stylePath, 'utf8')

script = script
  .replaceAll('new URL(`sqlite3-', 'new URL(`assets/sqlite3-')
  .replaceAll('</script', '<\\/script')

html = html
  .replace(scriptMatch[0], () => `<script type="module">${script}</script>`)
  .replace(styleMatch[0], () => `<style>${style}</style>`)

await writeFile(indexPath, html, 'utf8')
await Promise.all([unlink(scriptPath), unlink(stylePath)])

const assetPaths = (await walk(distDir)).filter((path) => path !== serviceWorkerPath).sort()
const files = ['./', ...assetPaths.map((path) => `./${relative(distDir, path).replaceAll('\\', '/')}`)]
const fingerprint = createHash('sha256')
for (const path of assetPaths) fingerprint.update(await readFile(path))
const buildId = fingerprint.digest('hex').slice(0, 10)
const source = await readFile(serviceWorkerPath, 'utf8')
const finalized = source
  .replace('__BUILD_ID__', buildId)
  .replace('["__ASSET_LIST__"]', JSON.stringify(files))

await writeFile(serviceWorkerPath, finalized, 'utf8')
console.log(`Service worker precache: ${files.length} files, build ${buildId}`)
