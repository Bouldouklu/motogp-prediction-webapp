'use client'

import { useState } from 'react'

export default function ScoreCalculationPanel() {
  const [recalculating, setRecalculating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleRecalculateAll = async () => {
    setRecalculating(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/scores/recalculate-all', { method: 'POST' })
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Failed to recalculate scores')

      const errText = data.errors?.length > 0 ? ` (${data.errors.length} races had errors)` : ''
      setMessage({
        type: data.errors?.length > 0 ? 'error' : 'success',
        text: `Recalculated ${data.racesProcessed} races — ${data.totalScoresCalculated} player scores updated.${errText}`,
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to recalculate scores',
      })
    } finally {
      setRecalculating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Recalculate scores for every completed race at once.
        </p>
        <button
          onClick={handleRecalculateAll}
          disabled={recalculating}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {recalculating ? 'Recalculating…' : 'Recalculate All Races'}
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  )
}
