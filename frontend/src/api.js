/**
 * API client for Ocean Climate & Coral Bleaching backend.
 * Uses Vite proxy (/api -> localhost:8000) in development.
 */

const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

async function fetchJSON(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Request failed: ${res.status}`)
  }
  return res.json()
}

export const api = {
  getSummary: () => fetchJSON('/summary'),
  getVisualizations: () => fetchJSON('/visualizations'),
  getModelMetrics: () => fetchJSON('/model-metrics'),
  getLocations: () => fetchJSON('/locations'),
  predictBleaching: (data) =>
    fetchJSON('/predict-bleaching', { method: 'POST', body: JSON.stringify(data) }),
  predictSpecies: (data) =>
    fetchJSON('/predict-species', { method: 'POST', body: JSON.stringify(data) }),
}
