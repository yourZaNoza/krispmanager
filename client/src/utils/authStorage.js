function normalizeUser(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return {
    id: value.id ?? null,
    name: value.name ?? '',
    email: value.email ?? '',
    position: value.position ?? '',
    role: value.role ?? null,
    avatar: value.avatar ?? null,
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('user')
    if (!raw || raw === 'undefined' || raw === 'null') {
      return {}
    }

    return normalizeUser(JSON.parse(raw))
  } catch {
    return {}
  }
}

export function setStoredUser(user) {
  const normalized = normalizeUser(user)

  if (!normalized.id) {
    localStorage.removeItem('user')
    return {}
  }

  localStorage.setItem('user', JSON.stringify(normalized))
  return normalized
}

export function clearStoredUser() {
  localStorage.removeItem('user')
}
