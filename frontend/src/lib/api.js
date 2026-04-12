const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

async function request(path, options = {}, authState = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': authState.userId || 'demo-rider',
      ...(authState.token ? { Authorization: `Bearer ${authState.token}` } : {}),
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.error || 'Request failed')
  }

  return response.json()
}

export function fetchDashboard() {
  return request('/api/dashboard')
}

export function fetchAccessibility() {
  return request('/api/accessibility')
}

export function fetchFavorites(authState) {
  return request('/api/favorites', {}, authState)
}

export function createFavorite(authState, payload) {
  return request('/api/favorites', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, authState)
}

export function fetchAlerts(authState) {
  return request('/api/alerts', {}, authState)
}

export function createAlert(authState, payload) {
  return request('/api/alerts', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, authState)
}
