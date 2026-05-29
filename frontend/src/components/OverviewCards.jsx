/**
 * Overview metric cards — high-level ocean health indicators from the dataset.
 */

const icons = {
  sst: '🌡️',
  ph: '🧪',
  observations: '📊',
  heatwave: '🔥',
  bleaching: '🪸',
}

export default function OverviewCards({ summary }) {
  if (!summary) return null

  const cards = [
    {
      label: 'Avg Sea Surface Temp',
      value: `${summary.avg_sst}°C`,
      icon: icons.sst,
      sub: 'Global reef average',
    },
    {
      label: 'Avg pH Level',
      value: summary.avg_ph,
      icon: icons.ph,
      sub: 'Ocean acidity indicator',
    },
    {
      label: 'Total Observations',
      value: summary.total_observations.toLocaleString(),
      icon: icons.observations,
      sub: `${summary.date_range.start} – ${summary.date_range.end}`,
    },
    {
      label: 'Marine Heatwaves',
      value: `${summary.heatwave_percent}%`,
      icon: icons.heatwave,
      sub: 'Records during heatwave events',
    },
    {
      label: 'Most Common Severity',
      value: summary.most_common_bleaching,
      icon: icons.bleaching,
      sub: 'Dominant bleaching category',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="card p-5 hover:border-ocean-500/50 transition-colors">
          <div className="flex items-start justify-between">
            <span className="text-2xl">{card.icon}</span>
          </div>
          <p className="text-ocean-300 text-sm mt-3">{card.label}</p>
          <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
          <p className="text-xs text-ocean-400 mt-1">{card.sub}</p>
        </div>
      ))}
    </div>
  )
}
