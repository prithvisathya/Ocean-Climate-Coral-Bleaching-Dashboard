import Dashboard from './pages/Dashboard'

function App() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-ocean-700/50 bg-ocean-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌊</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Ocean Climate & Coral Bleaching Dashboard
              </h1>
              <p className="text-sm text-ocean-300 hidden sm:block">
                ML-powered predictions for reef health monitoring
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard />
      </main>

      {/* Footer */}
      <footer className="border-t border-ocean-700/50 mt-12 py-6 text-center text-sm text-ocean-400">
        Ocean Climate & Coral Bleaching Prediction Dashboard · Portfolio Project
      </footer>
    </div>
  )
}

export default App
