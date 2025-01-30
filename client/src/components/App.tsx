import Home from './Home'
import circuitLogo from '../assets/circuit_logo.svg'

function App() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-200 to-gray-200">
      {/* Gradient background */}
      <div className="absolute inset-0 overflow-hidden opacity-80"></div>

      <div className="relative py-12 sm:py-20">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-8">
              {/* <img src={circuitLogo} alt="Circuit Logo" className="w-16 h-16" />
              <h1 className="text-4xl md:text-6xl font-bold text-black-500">
                Converge
              </h1> */}
            </div>
          </div>
          
          <Home />
        </div>
      </div>
    </div>
  )
}

export default App
