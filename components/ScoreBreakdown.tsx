'use client'

import { useEffect, useState } from 'react'
import { ScoreBreakdown as ScoreBreakdownType } from '@/lib/scoring'

interface ScoreBreakdownProps {
  raceId: string
  playerId?: string
}

export default function ScoreBreakdown({ raceId, playerId }: ScoreBreakdownProps) {
  const [breakdowns, setBreakdowns] = useState<ScoreBreakdownType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [raceName, setRaceName] = useState<string>('')

  useEffect(() => {
    async function fetchBreakdown() {
      try {
        setLoading(true)
        const params = new URLSearchParams({ raceId })
        if (playerId) params.append('playerId', playerId)

        const response = await fetch(`/api/scores/breakdown?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch score breakdown')
        }

        const data = await response.json()
        setBreakdowns(data.breakdowns)
        setRaceName(data.race.name)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchBreakdown()
  }, [raceId, playerId])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">Error: {error}</p>
      </div>
    )
  }

  if (breakdowns.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-200">
          No score data available for this race yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{raceName} - Score Breakdown</h2>

      {breakdowns.map((breakdown) => (
        <div
          key={breakdown.player_id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6"
        >
          {/* Player Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">{breakdown.player_name}</h3>
            <div className="flex items-center gap-4">
              {breakdown.is_late && (
                <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium">
                  Late Submission
                </span>
              )}
              <div className="text-right">
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Points</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {breakdown.total_points}
                </div>
              </div>
            </div>
          </div>

          {/* Score Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sprint Winner */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                  Sprint Winner
                </h4>
                <span className={`font-bold text-lg ${getPointsColor(breakdown.sprint_points)}`}>
                  +{breakdown.sprint_points}
                </span>
              </div>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Predicted: </span>
                  <span className="font-medium">{breakdown.sprint_winner_prediction || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Actual: </span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {breakdown.sprint_winner_actual || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Race Winner */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                  Race Winner
                </h4>
                <span className={`font-bold text-lg ${getPointsColor(breakdown.race_points)}`}>
                  +{breakdown.race_points}
                </span>
              </div>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Predicted: </span>
                  <span className="font-medium">{breakdown.race_winner_prediction || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Actual: </span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {breakdown.race_winner_actual || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Glorious 7 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                  Glorious 7th
                </h4>
                <span className={`font-bold text-lg ${getPointsColor(breakdown.glorious_7_points)}`}>
                  +{breakdown.glorious_7_points}
                </span>
              </div>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Predicted: </span>
                  <span className="font-medium">{breakdown.glorious_7_prediction || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Actual: </span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {breakdown.glorious_7_actual || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Penalty Section */}
          {breakdown.penalty_points > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-red-600 dark:text-red-400">
                <span className="font-semibold">Late Submission Penalty</span>
                <span className="font-bold text-lg">-{breakdown.penalty_points}</span>
              </div>
            </div>
          )}

          {/* Points Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Sprint ({breakdown.sprint_points}) + Race ({breakdown.race_points}) + Glorious 7 (
                {breakdown.glorious_7_points})
                {breakdown.penalty_points > 0 && ` - Penalty (${breakdown.penalty_points})`}
              </span>
              <span className="font-semibold">= {breakdown.total_points} points</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Helper function to get color class based on points earned
 */
function getPointsColor(points: number): string {
  if (points >= 12) return 'text-green-600 dark:text-green-400'
  if (points >= 7) return 'text-blue-600 dark:text-blue-400'
  if (points >= 4) return 'text-yellow-600 dark:text-yellow-400'
  if (points > 0) return 'text-orange-600 dark:text-orange-400'
  return 'text-gray-500 dark:text-gray-500'
}
