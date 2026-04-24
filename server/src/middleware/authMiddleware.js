const jwt = require('jsonwebtoken')

function parseCookies(req) {
  const cookies = {}
  const header = req.headers.cookie
  if (!header) return cookies
  header.split(';').forEach(pair => {
    const [name, ...rest] = pair.split('=')
    cookies[name.trim()] = decodeURIComponent(rest.join('=').trim())
  })
  return cookies
}

module.exports = (req, res, next) => {
  const cookies = parseCookies(req)
  const token = cookies.token

  if (!token) {
    return res.status(401).json({ message: 'Не авторизован' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key')
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ message: 'Токен недействителен' })
  }
}
