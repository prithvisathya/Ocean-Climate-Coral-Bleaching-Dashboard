/**
 * Interactive ML prediction panel.
 * Users input ocean conditions; backend Random Forest models return
 * bleaching severity (classification) and species count (regression).
 */

import { useEffect, useState } from 'react'
import { api } from '../api'

const RISK_STYLES = {
  low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  moderate: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  high: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  critical: 'bg-red-500/20 text-red-300 border-red-500/40',
}

export default function PredictionPanel({ locations }) {
  const [form, setForm] = useState({
    location: '',
    sst: 28.5,
    ph: 8.02,
    marine_heatwave: false,
    latitude: 0,
    longitude: 0,
  })
  const [bleachingResult, setBleachingResult] = useState(null)
  const [speciesResult, setSpeciesResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (locations?.length && !form.location) {
      const first = locations[0]
      setForm((f) => ({
        ...f,
        location: first.name,
        latitude: first.latitude,
        longitude: first.longitude,
        sst: first.avg_sst,
        ph: first.avg_ph,
      }))
    }
  }, [locations])

  const handleLocationChange = (name) => {
    const loc = locations.find((l) => l.name === name)
    if (loc) {
      setForm((f) => ({
        ...f,
        location: name,
        latitude: loc.latitude,
        longitude: loc.longitude,
        sst: loc.avg_sst,
        ph: loc.avg_ph,
      }))
    }
  }

  const buildPayload = () => ({
    location: form.location,
    sst: parseFloat(form.sst),
    ph: parseFloat(form.ph),
    marine_heatwave: form.marine_heatwave,
    latitude: parseFloat(form.latitude),
    longitude: parseFloat(form.longitude),
  })

  const predictBleaching = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.predictBleaching(buildPayload())
      setBleachingResult(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const predictSpecies = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.predictSpecies(buildPayload())
      setSpeciesResult(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6">
      <h2 className="section-title">🔮 Interactive Predictions</h2>
      <p className="text-sm text-ocean-300 mb-6">
        Enter ocean conditions to predict coral bleaching risk and reef biodiversity using trained Random Forest models.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-ocean-300 mb-1">Location</label>
          <select
            value={form.location}
            onChange={(e) => handleLocationChange(e.target.value)}
            className="w-full rounded-lg bg-ocean-900/80 border border-ocean-600 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-ocean-400"
          >
            {locations?.map((loc) => (
              <option key={loc.name} value={loc.name}>{loc.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-ocean-300 mb-1">SST (°C)</label>
          <input
            type="number"
            step="0.1"
            min="20"
            max="35"
            value={form.sst}
            onChange={(e) => setForm({ ...form, sst: e.target.value })}
            className="w-full rounded-lg bg-ocean-900/80 border border-ocean-600 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-ocean-400"
          />
        </div>

        <div>
          <label className="block text-sm text-ocean-300 mb-1">pH Level</label>
          <input
            type="number"
            step="0.001"
            min="7.5"
            max="8.5"
            value={form.ph}
            onChange={(e) => setForm({ ...form, ph: e.target.value })}
            className="w-full rounded-lg bg-ocean-900/80 border border-ocean-600 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-ocean-400"
          />
        </div>

        <div>
          <label className="block text-sm text-ocean-300 mb-1">Latitude</label>
          <input
            type="number"
            step="0.0001"
            value={form.latitude}
            onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            className="w-full rounded-lg bg-ocean-900/80 border border-ocean-600 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-ocean-400"
          />
        </div>

        <div>
          <label className="block text-sm text-ocean-300 mb-1">Longitude</label>
          <input
            type="number"
            step="0.0001"
            value={form.longitude}
            onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            className="w-full rounded-lg bg-ocean-900/80 border border-ocean-600 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-ocean-400"
          />
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.marine_heatwave}
              onChange={(e) => setForm({ ...form, marine_heatwave: e.target.checked })}
              className="w-5 h-5 rounded border-ocean-600 bg-ocean-900 text-ocean-400 focus:ring-ocean-400"
            />
            <span className="text-sm text-ocean-200">Marine Heatwave Active</span>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mt-6">
        <button
          onClick={predictBleaching}
          disabled={loading}
          className="px-5 py-2.5 rounded-lg bg-coral-500 hover:bg-coral-600 text-white font-medium transition-colors disabled:opacity-50"
        >
          Predict Bleaching Severity
        </button>
        <button
          onClick={predictSpecies}
          disabled={loading}
          className="px-5 py-2.5 rounded-lg bg-ocean-500 hover:bg-ocean-400 text-white font-medium transition-colors disabled:opacity-50"
        >
          Predict Species Count
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {bleachingResult && (
          <div className={`p-4 rounded-lg border ${RISK_STYLES[bleachingResult.risk_level] || RISK_STYLES.moderate}`}>
            <h3 className="font-semibold mb-2">Bleaching Prediction</h3>
            <p className="text-2xl font-bold">{bleachingResult.predicted_severity}</p>
            <p className="text-sm mt-1 capitalize">Risk level: {bleachingResult.risk_level}</p>
            <div className="mt-3 space-y-1">
              {Object.entries(bleachingResult.probabilities).map(([sev, prob]) => (
                <div key={sev} className="flex justify-between text-xs">
                  <span>{sev}</span>
                  <span>{(prob * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {speciesResult && (
          <div className="p-4 rounded-lg border bg-ocean-500/20 text-ocean-100 border-ocean-500/40">
            <h3 className="font-semibold mb-2">Species Prediction</h3>
            <p className="text-2xl font-bold">{speciesResult.predicted_species}</p>
            <p className="text-sm mt-2 text-ocean-200">{speciesResult.interpretation}</p>
          </div>
        )}
      </div>
    </div>
  )
}
