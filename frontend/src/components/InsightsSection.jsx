/**
 * Auto-generated insights from statistical analysis of ocean climate data.
 * Connects observed patterns to coral bleaching ecological interpretation.
 */

const TYPE_STYLES = {
  warning: 'border-yellow-500/40 bg-yellow-500/10',
  danger: 'border-red-500/40 bg-red-500/10',
  info: 'border-ocean-400/40 bg-ocean-500/10',
}

export default function InsightsSection({ insights }) {
  if (!insights?.length) return null

  return (
    <div className="card p-6">
      <h2 className="section-title">💡 Key Insights</h2>
      <p className="text-sm text-ocean-300 mb-4">
        Data-driven findings linking ocean conditions to coral reef health and bleaching risk.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, i) => (
          <div
            key={i}
            className={`p-4 rounded-lg border ${TYPE_STYLES[insight.type] || TYPE_STYLES.info}`}
          >
            <h3 className="font-semibold text-ocean-100 mb-2">{insight.title}</h3>
            <p className="text-sm text-ocean-200 leading-relaxed">{insight.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
