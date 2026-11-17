// Starts the server on a free port and checks what visitors and Railway rely on.
const { test, before, after } = require('node:test')
const assert = require('node:assert')
const { spawn } = require('node:child_process')
const path = require('node:path')

const PORT = 3999
const base = `http://127.0.0.1:${PORT}`
let proc

before(async () => {
  proc = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], { env: { ...process.env, PORT: String(PORT) } })
  for (let i = 0; i < 50; i++) {
    try { await fetch(`${base}/healthz`); return } catch { await new Promise((r) => setTimeout(r, 100)) }
  }
  throw new Error('server did not start')
})
after(() => proc && proc.kill())

test('home page is served as HTML with security headers', async () => {
  const res = await fetch(`${base}/`)
  assert.equal(res.status, 200)
  assert.match(res.headers.get('content-type'), /text\/html/)
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff')
  assert.match(res.headers.get('content-security-policy'), /frame-ancestors 'none'/)
  const html = await res.text()
  assert.match(html, /<title>Olympic Gym/)
  assert.match(html, /https:\/\/app\.olympicgym\.pk/)
  assert.match(html, /https:\/\/admin\.olympicgym\.pk/)
})

test('logo, robots.txt and sitemap.xml are served', async () => {
  for (const [p, type] of [['/logo.svg', /image\/svg\+xml/], ['/robots.txt', /text\/plain/], ['/sitemap.xml', /xml/]]) {
    const res = await fetch(base + p)
    assert.equal(res.status, 200, p)
    assert.match(res.headers.get('content-type'), type, p)
  }
})

test('health check answers for Railway', async () => {
  const res = await fetch(`${base}/healthz`)
  assert.equal(res.status, 200)
  assert.equal(await res.text(), 'ok')
})

test('unknown pages get the 404 page', async () => {
  const res = await fetch(`${base}/no-such-page`)
  assert.equal(res.status, 404)
  assert.match(await res.text(), /Page not found/)
})

test('files outside public/ cannot be read', async () => {
  for (const p of ['/../server.js', '/%2e%2e/package.json', '/..%2fserver.js']) {
    const res = await fetch(base + p)
    assert.equal(res.status, 404, p)
    assert.doesNotMatch(await res.text(), /createServer|"start"/, p)
  }
})

test('only GET and HEAD are allowed', async () => {
  const res = await fetch(`${base}/`, { method: 'POST', body: 'x' })
  assert.equal(res.status, 405)
})
