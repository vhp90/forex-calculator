import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-blue-400 mb-4">
            Free Forex Position Size Calculator
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Professional-grade calculator for forex traders. Manage risk and optimize your trading positions.
          </p>
        </header>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-blue-400 mb-6">Why Use Our Forex Calculator?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-lg shadow-black/10 transition-all duration-200 hover:border-gray-600/50">
              <h3 className="text-xl font-semibold text-white mb-3">Risk Management</h3>
              <p className="text-gray-300">Calculate optimal position sizes based on your risk tolerance and account size.</p>
            </div>
            <div className="p-6 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-lg shadow-black/10 transition-all duration-200 hover:border-gray-600/50">
              <h3 className="text-xl font-semibold text-white mb-3">Precise Calculations</h3>
              <p className="text-gray-300">Get accurate calculations for lots, units, and pip values across all major currency pairs.</p>
            </div>
            <div className="p-6 bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-lg shadow-black/10 transition-all duration-200 hover:border-gray-600/50">
              <h3 className="text-xl font-semibold text-white mb-3">Trading Insights</h3>
              <p className="text-gray-300">Receive professional trading suggestions and risk analysis for better decision making.</p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-blue-400 mb-6">Features</h2>
          <ul className="grid md:grid-cols-2 gap-6">
            <li className="flex items-start">
              <svg className="h-6 w-6 text-green-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="ml-3 text-gray-300">Position size calculation in lots and units</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-green-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="ml-3 text-gray-300">Support for all major currency pairs</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-green-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="ml-3 text-gray-300">Real-time exchange rate data</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-green-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="ml-3 text-gray-300">Risk percentage calculation</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-green-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="ml-3 text-gray-300">Stop loss and take profit analysis</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-green-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="ml-3 text-gray-300">Professional trading suggestions</span>
            </li>
          </ul>
        </section>

        <div className="text-center">
          <Link
            href="/calculator"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-500/20 transition-all duration-200"
          >
            Get Started
            <svg className="ml-2 -mr-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </main>
  )
}
