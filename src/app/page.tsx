import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900 text-white">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4 text-blue-400">
          Forex Risk Calculator
        </h1>
        <p className="text-lg text-gray-300 mb-8">
          Make smarter trading decisions with our advanced position size calculator and risk analysis tools.
        </p>
        <div className="space-x-4">
          <Link
            href="/calculator"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  )
}

