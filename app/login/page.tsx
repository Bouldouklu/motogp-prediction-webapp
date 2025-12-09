'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, passphrase }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      // Redirect based on user role
      // Admin users go to admin panel, regular players go to dashboard
      if (data.user.name.toLowerCase() === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center p-6 font-sans text-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-display font-black italic tracking-tighter uppercase transform -skew-x-12 leading-none mb-4">
            MotoGP <span className="text-motogp-red">Prediction</span>
          </h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">
            Rider Sign In
          </p>
        </div>

        <div className="bg-track-gray p-8 rounded-xl border-l-4 border-motogp-red border-y border-r border-gray-800 shadow-2xl relative overflow-hidden">
          {/* Decorative bg element */}
          <div className="absolute -right-10 -top-10 text-9xl opacity-5 font-display italic font-black pointer-events-none">
            GO
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-bold uppercase tracking-wider text-motogp-red mb-1 font-display italic"
              >
                Player Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-black/20 border border-gray-700 text-white font-bold placeholder-gray-600 focus:outline-none focus:border-motogp-red focus:bg-black/40 transition-all"
                placeholder="ENTER NAME"
              />
            </div>

            <div>
              <label
                htmlFor="passphrase"
                className="block text-xs font-bold uppercase tracking-wider text-motogp-red mb-1 font-display italic"
              >
                Passphrase
              </label>
              <input
                type="password"
                id="passphrase"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                required
                className="w-full px-4 py-3 bg-black/20 border border-gray-700 text-white font-bold placeholder-gray-600 focus:outline-none focus:border-motogp-red focus:bg-black/40 transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-900/20 border-l-4 border-red-600 text-red-400 text-sm font-bold">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-4 bg-motogp-red hover:bg-white hover:text-black text-white font-black italic uppercase text-xl tracking-wider transform -skew-x-12 transition-all shadow-lg mt-4"
            >
              <span className="inline-block skew-x-12">
                {loading ? 'Starting Engine...' : 'Start Engine'}
              </span>
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-gray-800">
            <Link
              href="/"
              className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-white transition-colors"
            >
              ← Back to Pit Lane
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
