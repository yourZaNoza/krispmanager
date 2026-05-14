import { ref } from 'vue'
import axios from 'axios'

const api = axios.create({ withCredentials: true })

// Fallback defaults shown before server data loads
const FALLBACK = [
  { name: 'Ежемесячное', bg: '#E8F5E9', color: '#2E7D32' },
  { name: 'Личное',      bg: '#FFF3E0', color: '#E65100' },
  { name: 'Важное',      bg: '#FFFDE7', color: '#F57F17' },
  { name: 'Проект',      bg: '#E3F2FD', color: '#1565C0' },
  { name: 'Срочное',     bg: '#FFEBEE', color: '#C62828' },
  { name: 'Рабочее',     bg: '#F3E5F5', color: '#6A1B9A' },
]

export const TAGS = ref([...FALLBACK])
let loaded = false

export async function loadNoteTags() {
  if (loaded) return
  try {
    const { data } = await api.get('/api/tags?scope=note')
    if (data.length) {
      TAGS.value = data.map(t => ({ name: t.label, bg: t.bg, color: t.color }))
    }
    loaded = true
  } catch { /* keep fallback */ }
}

export function tagStyle(name) {
  const t = TAGS.value.find(t => t.name === name)
  return t
    ? { backgroundColor: t.bg, color: t.color, borderColor: 'transparent' }
    : { backgroundColor: '#f5f5f5', color: '#616161' }
}

export function tagColor(name) {
  return TAGS.value.find(t => t.name === name)?.color ?? '#9E9E9E'
}
