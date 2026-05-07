const jwt      = require('jsonwebtoken')
const store    = require('../config/sseStore')

function parseCookies(header = '') {
  const c = {}
  header.split(';').forEach(p => {
    const [k, ...v] = p.split('=')
    if (k) c[k.trim()] = decodeURIComponent(v.join('=').trim())
  })
  return c
}

// GET /api/events/stream
exports.stream = (req, res) => {
  // Authenticate via cookie
  const cookies = parseCookies(req.headers.cookie)
  const token   = cookies.token
  if (!token) return res.status(401).end()

  let userId
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key')
    userId = decoded.id
  } catch {
    return res.status(401).end()
  }

  res.setHeader('Content-Type',  'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection',    'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  // Initial heartbeat so browser knows connection is alive
  res.write(': connected\n\n')

  store.addClient(userId, res)

  // Keep-alive every 25 seconds
  const hb = setInterval(() => {
    try { res.write(': heartbeat\n\n') } catch { clearInterval(hb) }
  }, 25000)

  req.on('close', () => {
    clearInterval(hb)
    store.removeClient(userId, res)
  })
}
