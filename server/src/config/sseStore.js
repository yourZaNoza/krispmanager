// In-memory SSE client registry: Map<userId, Set<res>>
const clients = new Map()

function addClient(userId, res) {
  const id = String(userId)
  if (!clients.has(id)) clients.set(id, new Set())
  clients.get(id).add(res)
}

function removeClient(userId, res) {
  const id = String(userId)
  const set = clients.get(id)
  if (!set) return
  set.delete(res)
  if (!set.size) clients.delete(id)
}

function pushToUser(userId, event) {
  const set = clients.get(String(userId))
  if (!set) return
  const data = `data: ${JSON.stringify(event)}\n\n`
  set.forEach(res => {
    try { res.write(data) } catch { /* client disconnected */ }
  })
}

// Redis Pub/Sub layer (activated when REDIS_URL is set)
function tryConnectRedis() {
  const url = process.env.REDIS_URL
  if (!url) return
  try {
    const Redis = require('ioredis')
    const pub = new Redis(url)
    const sub = new Redis(url)
    sub.subscribe('task-notifications')
    sub.on('message', (channel, message) => {
      try {
        const { userId, event } = JSON.parse(message)
        pushToUser(userId, event)
      } catch {}
    })
    module.exports.redisPublisher = pub
    console.log('Redis Pub/Sub connected:', url)
  } catch (e) {
    console.log('Redis not available, using in-process SSE store')
  }
}

tryConnectRedis()

module.exports = { addClient, removeClient, pushToUser, redisPublisher: null }
