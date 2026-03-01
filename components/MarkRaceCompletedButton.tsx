'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MarkRaceCompletedButton({ raceId }: { raceId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/races/${raceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to update status')
      } else {
        router.refresh()
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-3 py-1 text-xs font-medium bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-md transition-colors"
      >
        {loading ? 'Updating…' : 'Mark Completed'}
      </button>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  )
}
