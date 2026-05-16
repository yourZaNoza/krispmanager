import { ref } from 'vue'
import axios from 'axios'
import { getStoredUser } from './authStorage'

const map = ref({})
let fetchPromise = null

const api = axios.create({ withCredentials: true })

// Seed current user's avatar immediately from localStorage
const user = getStoredUser()
if (user.id && user.avatar) {
  map.value[user.id] = user.avatar
}

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
