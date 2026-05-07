import { onMounted, onUnmounted } from 'vue'

// Singleton SSE connection shared across all components
const listeners = new Set()
let es       = null
let refCount = 0

function openConnection() {
  if (es && es.readyState !== EventSource.CLOSED) return
  es = new EventSource('http://localhost:3000/api/events/stream', { withCredentials: true })
  es.onmessage = (e) => {
    try {
      const event = JSON.parse(e.data)
      listeners.forEach(fn => fn(event))
    } catch { /* ignore malformed frames */ }
  }
  // EventSource auto-reconnects on error — no manual handling needed
}

function closeConnection() {
  if (es) { es.close(); es = null }
}

/**
 * Subscribe to real-time server events.
 * handler(event) is called for each SSE message where event = { type, ...payload }.
 * Only one EventSource connection is opened regardless of subscriber count.
 */
export function useEvents(handler) {
  onMounted(() => {
    listeners.add(handler)
    refCount++
    if (refCount === 1) openConnection()
  })

  onUnmounted(() => {
    listeners.delete(handler)
    refCount--
    if (refCount === 0) closeConnection()
  })
}
