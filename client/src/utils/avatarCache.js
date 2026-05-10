import { ref } from 'vue'
import axios from 'axios'

const map = ref({})
let fetchPromise = null

const api = axios.create({ baseURL: 'http://localhost:3000', withCredentials: true })

// Seed current user's avatar immediately from localStorage
try {
  const stored = localStorage.getItem('user')
  if (stored) {
    const u = JSON.parse(stored)
    if (u?.id && u?.avatar) map.value[u.id] = u.avatar
  }
} catch { /* ignore */ }

export function loadAvatars() {
  if (!fetchPromise) {
    fetchPromise = api.get('/api/auth/avatars')
      .then(({ data }) => { map.value = { ...map.value, ...data } })
      .catch(() => { fetchPromise = null })
  }
  return fetchPromise
}

export function getAvatarUrl(userId) {
  return userId ? (map.value[userId] || null) : null
}

export function setAvatarUrl(userId, url) {
  map.value = { ...map.value, [userId]: url }
}
