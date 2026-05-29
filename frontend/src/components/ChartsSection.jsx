/**
 * Dashboard visualizations connecting ocean data to coral bleaching risk.
 * Each chart is fed by /visualizations endpoint JSON.
 */

import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'

const SEVERITY_COLORS = {
  None: '#34d399',
  Low: '#fbbf24',
  Medium: '#fb923c',
  High: '#ef4444',
}

const ChartCard = ({ title, subtitle, children }) => (
  <div className="card p-5">
    <h3 className="font-semibold text-ocean-100">{title}</h3>
    {subtitle && <p className="text-xs text-ocean-400 mb-3">{subtitle}</p>}
    <div className="h-64">{children}</div>
  </div>
)

const tooltipStyle = {
  contentStyle: { background: '#153f61', border: '1px solid #2a8acc', borderRadius: '8px' },
  labelStyle: { color: '#c5e4f7' },
}

export default function ChartsSection({ data }) {
  if (!data) return null

  const { sst_over_time, ph_over_time, bleaching_by_location, sst_vs_species,
    heatwave_comparison, map_points, severity_distribution } = data

  // Downsample scatter for performance
  const scatterData = sst_vs_species.filter((_, i) => i % 3 === 0)

  // Aggregate map points by location for cleaner map-style view
  const mapAggregated = Object.values(
    map_points.reduce((acc, pt) => {
      const key = pt.location
      if (!acc[key]) {
        acc[key] = { ...pt, count: 1, lat: pt.lat, lon: pt.lon }
      } else {
        acc[key].count += 1
        acc[key].lat = (acc[key].lat * (acc[key].count - 1) + pt.lat) / acc[key].count
        acc[key].lon = (acc[key].lon * (acc[key].count - 1) + pt.lon) / acc[key].count
      }
      return acc
    }, {})
  )

  return (
    <div className="space-y-6">
      <h2 className="section-title">📈 Data Visualizations</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="SST Over Time"
          subtitle="Rising sea surface temperatures stress coral symbionts and drive bleaching"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sst_over_time}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a8acc33" />
              <XAxis dataKey="date" tick={{ fill: '#8ec9ef', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8ec9ef', fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="sst" stroke="#ff6b5b" strokeWidth={2} dot={false} name="SST (°C)" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="pH Over Time"
          subtitle="Ocean acidification trends affect calcification and reef biodiversity"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ph_over_time}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a8acc33" />
              <XAxis dataKey="date" tick={{ fill: '#8ec9ef', fontSize: 11 }} />
              <YAxis tick={{ fill: '#8ec9ef', fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="ph" stroke="#52a8e0" strokeWidth={2} dot={false} name="pH" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Bleaching Severity by Location"
          subtitle="Geographic hotspots show elevated average bleaching (0=None → 3=High)"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bleaching_by_location} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#2a8acc33" />
              <XAxis type="number" domain={[0, 3]} tick={{ fill: '#8ec9ef', fontSize: 11 }} />
              <YAxis dataKey="location" type="category" width={120} tick={{ fill: '#8ec9ef', fontSize: 10 }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="avg_severity" fill="#ff6b5b" radius={[0, 4, 4, 0]} name="Avg Severity" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="SST vs Species Observed"
          subtitle="Thermal stress can reduce reef biodiversity (species count proxy)"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a8acc33" />
              <XAxis dataKey="sst" name="SST" tick={{ fill: '#8ec9ef', fontSize: 11 }} />
              <YAxis dataKey="species" name="Species" tick={{ fill: '#8ec9ef', fontSize: 11 }} />
              <Tooltip {...tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={scatterData} fill="#52a8e0" fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Heatwave vs Bleaching Severity"
          subtitle="Marine heatwaves amplify coral bleaching events"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={heatwave_comparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a8acc33" />
              <XAxis dataKey="heatwave" tick={{ fill: '#8ec9ef', fontSize: 10 }} />
              <YAxis tick={{ fill: '#8ec9ef', fontSize: 11 }} />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {['None', 'Low', 'Medium', 'High'].map((sev) => (
                <Bar key={sev} dataKey={sev} stackId="a" fill={SEVERITY_COLORS[sev]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Bleaching Severity Distribution"
          subtitle="Overall reef health snapshot across all observations"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={severity_distribution}
                dataKey="count"
                nameKey="severity"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ severity, count }) => `${severity}: ${count}`}
                labelLine={{ stroke: '#8ec9ef' }}
              >
                {severity_distribution.map((entry) => (
                  <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Map-style visualization using lat/lon scatter */}
      <ChartCard
        title="Observation Map (Lat/Lon)"
        subtitle="Spatial distribution of reef monitoring sites — bubble size reflects observation density"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a8acc33" />
            <XAxis
              type="number"
              dataKey="lon"
              name="Longitude"
              tick={{ fill: '#8ec9ef', fontSize: 11 }}
              label={{ value: 'Longitude', position: 'bottom', fill: '#8ec9ef', fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="lat"
              name="Latitude"
              tick={{ fill: '#8ec9ef', fontSize: 11 }}
              label={{ value: 'Latitude', angle: -90, position: 'insideLeft', fill: '#8ec9ef', fontSize: 11 }}
            />
            <Tooltip
              {...tooltipStyle}
              content={({ payload }) => {
                if (!payload?.length) return null
                const d = payload[0].payload
                return (
                  <div className="bg-ocean-800 border border-ocean-600 rounded-lg p-2 text-xs">
                    <p className="font-semibold">{d.location}</p>
                    <p>Lat: {d.lat?.toFixed(2)}, Lon: {d.lon?.toFixed(2)}</p>
                    <p>Observations: {d.count}</p>
                  </div>
                )
              }}
            />
            <Scatter
              data={mapAggregated}
              fill="#2a8acc"
              fillOpacity={0.7}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}
