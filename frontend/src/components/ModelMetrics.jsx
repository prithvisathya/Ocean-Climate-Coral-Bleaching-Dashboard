/**
 * Display ML model performance metrics from train/test evaluation.
 */

export default function ModelMetrics({ metrics }) {
  if (!metrics) return null

  const { classification, regression } = metrics

  return (
    <div className="card p-6">
      <h2 className="section-title">🤖 Model Performance</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classification metrics */}
        <div>
          <h3 className="font-medium text-ocean-200 mb-3">
            Bleaching Classifier ({classification.model})
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-ocean-900/50 rounded-lg p-3 text-center">
              <p className="text-xs text-ocean-400">Accuracy</p>
              <p className="text-xl font-bold text-white">{(classification.accuracy * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-ocean-900/50 rounded-lg p-3 text-center">
              <p className="text-xs text-ocean-400">Train</p>
              <p className="text-xl font-bold text-white">{classification.train_size}</p>
            </div>
            <div className="bg-ocean-900/50 rounded-lg p-3 text-center">
              <p className="text-xs text-ocean-400">Test</p>
              <p className="text-xl font-bold text-white">{classification.test_size}</p>
            </div>
          </div>

          <p className="text-xs text-ocean-400 mb-2">Confusion Matrix</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-ocean-400">
                  <th className="p-1"></th>
                  {classification.classes.map((c) => (
                    <th key={c} className="p-1">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classification.confusion_matrix.map((row, i) => (
                  <tr key={i}>
                    <td className="p-1 text-ocean-400">{classification.classes[i]}</td>
                    {row.map((val, j) => (
                      <td key={j} className="p-1 text-center bg-ocean-900/30 rounded">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Regression metrics */}
        <div>
          <h3 className="font-medium text-ocean-200 mb-3">
            Species Regressor ({regression.model})
          </h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-ocean-900/50 rounded-lg p-3 text-center">
              <p className="text-xs text-ocean-400">MAE</p>
              <p className="text-xl font-bold text-white">{regression.mae}</p>
            </div>
            <div className="bg-ocean-900/50 rounded-lg p-3 text-center">
              <p className="text-xs text-ocean-400">RMSE</p>
              <p className="text-xl font-bold text-white">{regression.rmse}</p>
            </div>
            <div className="bg-ocean-900/50 rounded-lg p-3 text-center">
              <p className="text-xs text-ocean-400">R² Score</p>
              <p className="text-xl font-bold text-white">{regression.r2}</p>
            </div>
            <div className="bg-ocean-900/50 rounded-lg p-3 text-center">
              <p className="text-xs text-ocean-400">Test Size</p>
              <p className="text-xl font-bold text-white">{regression.test_size}</p>
            </div>
          </div>

          <p className="text-xs text-ocean-400 mb-2">Classification Report (F1-scores)</p>
          <div className="space-y-1">
            {classification.classes.map((cls) => {
              const report = classification.classification_report[cls]
              if (!report || typeof report !== 'object') return null
              return (
                <div key={cls} className="flex justify-between text-xs bg-ocean-900/30 rounded px-2 py-1">
                  <span className="text-ocean-300">{cls}</span>
                  <span className="text-ocean-100">F1: {(report['f1-score'] * 100).toFixed(1)}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
