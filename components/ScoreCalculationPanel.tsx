'use client'

import { useState } from 'react'

interface Race {
  id: string
  round_number: number
  name: string
  country: string
  status: string
}

interface ScoreCalculationPanelProps {
  races: Race[]
}

interface PlayerScore {
  player_id: string
  race_id: string
  sprint_points: number
  race_points: number
  glorious_7_points: number
  penalty_points: number
}

export default function ScoreCalculationPanel({ races }: ScoreCalculationPanelProps) {
  const [selectedRaceId, setSelectedRaceId] = useState('')
  const [loading, setLoading] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [previewScores, setPreviewScores] = useState<PlayerScore[] | null>(null)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const completedRaces = races.filter((r) => r.status === 'completed')

  const handlePreview = async () => {
    if (!selectedRaceId) {
      setMessage({ type: 'error', text: 'Please select a race' })
      return
    }

    setPreviewing(true)
    setMessage(null)
    setPreviewScores(null)

    try {
      const response = await fetch(`/api/scores/calculate?raceId=${selectedRaceId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to preview scores')
      }

      setPreviewScores(data.scores)
      setMessage({ type: 'success', text: `Preview: ${data.scores.length} players will be scored` })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to preview scores',
      })
    } finally {
      setPreviewing(false)
    }
  }

  const handleCalculate = async () => {
    if (!selectedRaceId) {
      setMessage({ type: 'error', text: 'Please select a race' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/scores/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raceId: selectedRaceId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate scores')
      }

      setMessage({
        type: 'success',
        text: `Success! Calculated scores for ${data.scoresCalculated} players. ${
          data.penaltiesApplied > 0 ? `${data.penaltiesApplied} penalties applied.` : ''
        }`,
      })
      setPreviewScores(null)
      setSelectedRaceId('')
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to calculate scores',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Race selector */}
      <div>
        <label className="block text-sm font-medium mb-2">Select Race</label>
        <select
          value={selectedRaceId}
          onChange={(e) => {
            setSelectedRaceId(e.target.value)
            setMessage(null)
            setPreviewScores(null)
          }}
          disabled={loading || previewing}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
        >
          <option value="">Choose a race...</option>
          {completedRaces.map((race) => (
            <option key={race.id} value={race.id}>
              Round {race.round_number}: {race.name} ({race.country})
            </option>
          ))}
        </select>
      </div>

      {/* Preview scores table */}
      {previewScores && previewScores.length > 0 && (
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left">Player</th>
                <th className="px-3 py-2 text-center">Sprint</th>
                <th className="px-3 py-2 text-center">Race</th>
                <th className="px-3 py-2 text-center">G7</th>
                <th className="px-3 py-2 text-center">Penalty</th>
                <th className="px-3 py-2 text-center font-bold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {previewScores.map((score, idx) => {
                const total =
                  score.sprint_points +
                  score.race_points +
                  score.glorious_7_points -
                  score.penalty_points
                return (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-3 py-2">Player {idx + 1}</td>
                    <td className="px-3 py-2 text-center">{score.sprint_points}</td>
                    <td className="px-3 py-2 text-center">{score.race_points}</td>
                    <td className="px-3 py-2 text-center">{score.glorious_7_points}</td>
                    <td className="px-3 py-2 text-center text-red-600 dark:text-red-400">
                      {score.penalty_points > 0 ? `-${score.penalty_points}` : '-'}
                    </td>
                    <td className="px-3 py-2 text-center font-bold">{total}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handlePreview}
          disabled={!selectedRaceId || loading || previewing}
          className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {previewing ? 'Loading...' : 'Preview Scores'}
        </button>

        <button
          onClick={handleCalculate}
          disabled={!selectedRaceId || loading || previewing}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Calculating...' : 'Calculate & Save Scores'}
        </button>
      </div>

      {completedRaces.length === 0 && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No completed races available for score calculation.
        </p>
      )}
    </div>
  )
}
