import { useEffect, useState } from 'react'
import { api } from '../api'
import OverviewCards from '../components/OverviewCards'
import PredictionPanel from '../components/PredictionPanel'
import ChartsSection from '../components/ChartsSection'
import InsightsSection from '../components/InsightsSection'
import ModelMetrics from '../components/ModelMetrics'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [vizData, setVizData] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [summaryRes, vizRes, metricsRes, locRes] = await Promise.all([
          api.getSummary(),
          api.getVisualizations(),
          api.getModelMetrics(),
          api.getLocations(),
        ])
        setSummary(summaryRes)
        setVizData(vizRes)
        setMetrics(metricsRes)
        setLocations(locRes)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-pulse text-4xl mb-4">🌊</div>
          <p className="text-ocean-300">Loading ocean climate data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-8 text-center max-w-lg mx-auto mt-12">
        <p className="text-red-400 font-medium mb-2">Failed to connect to backend</p>
        <p className="text-sm text-ocean-300">{error}</p>
        <p className="text-xs text-ocean-400 mt-4">
          Make sure the FastAPI server is running: <code className="bg-ocean-900 px-2 py-1 rounded">uvicorn main:app --reload</code>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <OverviewCards summary={summary} />
      <PredictionPanel locations={locations} />
      <ChartsSection data={vizData} />
      <InsightsSection insights={vizData?.insights} />
      <ModelMetrics metrics={metrics} />
    </div>
  )
}
