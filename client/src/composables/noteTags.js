export const TAGS = [
  { name: 'Ежемесячное', bg: '#E8F5E9', color: '#2E7D32' },
  { name: 'Личное',      bg: '#FFF3E0', color: '#E65100' },
  { name: 'Важное',      bg: '#FFFDE7', color: '#F57F17' },
  { name: 'Проект',      bg: '#E3F2FD', color: '#1565C0' },
  { name: 'Срочное',     bg: '#FFEBEE', color: '#C62828' },
  { name: 'Рабочее',     bg: '#F3E5F5', color: '#6A1B9A' },
]

export function tagStyle(name) {
  const t = TAGS.find(t => t.name === name)
  return t
    ? { backgroundColor: t.bg, color: t.color, borderColor: 'transparent' }
    : { backgroundColor: '#f5f5f5', color: '#616161' }
}

// kept for backwards-compat with any existing usages
export function tagColor(name) {
  return TAGS.find(t => t.name === name)?.color ?? '#9E9E9E'
}
