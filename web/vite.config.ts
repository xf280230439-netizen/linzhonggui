import { createReadStream, existsSync, readdirSync, statSync } from 'node:fs'
import { extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin, type PreviewServer, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'

const localDatabasePath = fileURLToPath(new URL('../db/zhou.sqlite', import.meta.url))
const localLibraryPath = fileURLToPath(new URL('../library/', import.meta.url))
const bookExtensions = new Set(['.pdf', '.epub', '.mobi', '.azw3'])

function listLocalBooks(directory = localLibraryPath, prefix = ''): Array<{ name: string; size: number; url: string }> {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = join(directory, entry.name)
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) return listLocalBooks(absolutePath, relativePath)
    if (!entry.isFile() || !bookExtensions.has(extname(entry.name).toLowerCase())) return []
    return [{ name: entry.name, size: statSync(absolutePath).size, url: `/__local/books/${encodeURIComponent(relativePath)}` }]
  })
}

function isLoopback(remoteAddress: string | undefined) {
  const address = (remoteAddress || '').replace(/^::ffff:/, '')
  return address === '127.0.0.1' || address === '::1'
}

function bookContentType(extension: string) {
  if (extension === '.pdf') return 'application/pdf'
  if (extension === '.epub') return 'application/epub+zip'
  return 'application/octet-stream'
}

function localDatabaseGateway(): Plugin {
  const attach = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use('/__local/zhou.sqlite', (request, response) => {
      if (request.method !== 'GET') {
        response.statusCode = 405
        response.end('Method not allowed')
        return
      }
      if (!isLoopback(request.socket.remoteAddress)) {
        response.statusCode = 403
        response.end('Local access only')
        return
      }
      if (!existsSync(localDatabasePath)) {
        response.statusCode = 404
        response.end('Database not found')
        return
      }
      const stat = statSync(localDatabasePath)
      response.statusCode = 200
      response.setHeader('Content-Type', 'application/vnd.sqlite3')
      response.setHeader('Content-Length', stat.size)
      response.setHeader('Cache-Control', 'no-store')
      response.setHeader('X-Content-Type-Options', 'nosniff')
      createReadStream(localDatabasePath).pipe(response)
    })

    server.middlewares.use('/__local/library.json', (request, response) => {
      if (!isLoopback(request.socket.remoteAddress)) {
        response.statusCode = 403
        response.end('Local access only')
        return
      }
      const files = listLocalBooks()
      response.statusCode = 200
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.setHeader('Cache-Control', 'no-store')
      response.end(JSON.stringify(files))
    })

    server.middlewares.use('/__local/books', (request, response) => {
      if (!isLoopback(request.socket.remoteAddress)) {
        response.statusCode = 403
        response.end('Local access only')
        return
      }
      const requestedPath = decodeURIComponent((request.url || '').split('?')[0]).replace(/^\/+/, '')
      const extension = extname(requestedPath).toLowerCase()
      const libraryRoot = resolve(localLibraryPath)
      const absolutePath = resolve(libraryRoot, requestedPath)
      const insideLibrary = absolutePath.toLowerCase().startsWith(`${libraryRoot.toLowerCase()}${sep}`)
      if (!requestedPath || !insideLibrary || !bookExtensions.has(extension) || !existsSync(absolutePath)) {
        response.statusCode = 404
        response.end('Book not found')
        return
      }
      const stat = statSync(absolutePath)
      response.statusCode = 200
      response.setHeader('Content-Type', bookContentType(extension))
      response.setHeader('Content-Length', stat.size)
      response.setHeader('Cache-Control', 'no-store')
      response.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(requestedPath.split('/').pop() || 'book')}`)
      createReadStream(absolutePath).pipe(response)
    })
  }
  return {
    name: 'zhou-local-database-gateway',
    configureServer: attach,
    configurePreviewServer: attach,
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), localDatabaseGateway()],
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
})
