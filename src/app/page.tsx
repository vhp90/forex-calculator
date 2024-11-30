import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Free Forex Position Size Calculator
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Professional-grade calculator for forex traders. Manage risk and optimize your trading positions.
          </p>
        </header>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">Why Use Our Forex Calculator?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Risk Management</h3>
              <p className="text-gray-600">Calculate optimal position sizes based on your risk tolerance and account size.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Precise Calculations</h3>
              <p className="text-gray-600">Get accurate calculations for lots, units, and pip values across all major currency pairs.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Trading Insights</h3>
              <p className="text-gray-600">Receive professional trading suggestions and risk analysis for better decision making.</p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">Features</h2>
          <ul className="grid md:grid-cols-2 gap-6">
            <li className="flex items-start">
              <svg className="h-6 w-6 text-green-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="ml-3 text-gray-600">Position size calculation in lots and units</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-green-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="ml-3 text-gray-600">Risk-based lot size calculation</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-green-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="ml-3 text-gray-600">Stop loss and take profit calculator</span>
            </li>
            <li className="flex items-start">
              <svg className="h-6 w-6 text-green-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="ml-3 text-gray-600">Margin requirement calculation</span>
            </li>
          </ul>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-900 mb-6">How It Works</h2>
          <div className="prose prose-lg max-w-none text-gray-600">
            <p className="mb-4">
              Our Forex Position Size Calculator helps traders determine the optimal position size for their trades while managing risk effectively. Simply input your:
            </p>
            <ol className="list-decimal pl-6 mb-4">
              <li className="mb-2">Account size and currency</li>
              <li className="mb-2">Risk percentage per trade</li>
              <li className="mb-2">Entry and stop loss prices</li>
              <li className="mb-2">Currency pair</li>
            </ol>
            <p>
              The calculator will instantly provide you with the recommended position size, potential profit/loss calculations, and risk analysis.
            </p>
          </div>
        </section>

        <div className="text-center">
          <Link
            href="/calculator"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Try Our Calculator Now
          </Link>
        </div>
      </div>
    </main>
  )
}
