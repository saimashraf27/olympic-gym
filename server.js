// Serves the Olympic Gym website (the files in ./public) on Railway or any
// Node host. No dependencies: Node's own http, fs and path modules only.
//
//   PORT  port to listen on (Railway sets it; defaults to 3000)

const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.join(__dirname, 'public')
const PORT = Number(process.env.PORT) || 3000

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src https://fonts.gstatic.com",
    "img-src 'self' data: https://app.olympicgym.pk",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
}

function send(res, status, body, type, extra = {}) {
  res.writeHead(status, { 'Content-Type': type, ...SECURITY_HEADERS, ...extra })
  res.end(body)
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, 'Method not allowed', 'text/plain; charset=utf-8', { Allow: 'GET, HEAD' })
  }

  let pathname
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  } catch {
    return send(res, 400, 'Bad request', 'text/plain; charset=utf-8')
  }

  if (pathname === '/healthz') return send(res, 200, 'ok', 'text/plain; charset=utf-8', { 'Cache-Control': 'no-store' })
  if (pathname.endsWith('/')) pathname += 'index.html'

  // Resolve inside ./public only; anything that escapes it is a 404.
  const file = path.normalize(path.join(ROOT, pathname))
  if (!file.startsWith(ROOT + path.sep)) return notFound(res)

  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) return notFound(res)
    const ext = path.extname(file).toLowerCase()
    const type = TYPES[ext] || 'application/octet-stream'
    // HTML is always revalidated so a new deploy shows at once; assets cache for a day.
    const cache = ext === '.html' ? 'no-cache' : 'public, max-age=86400'
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size, 'Cache-Control': cache, ...SECURITY_HEADERS })
    if (req.method === 'HEAD') return res.end()
    fs.createReadStream(file).pipe(res)
  })
})

function notFound(res) {
  fs.readFile(path.join(ROOT, '404.html'), (err, body) => {
    send(res, 404, err ? 'Not found' : body, 'text/html; charset=utf-8', { 'Cache-Control': 'no-cache' })
  })
}

server.listen(PORT, () => {
  console.log(`Olympic Gym website on port ${PORT}`)
})
