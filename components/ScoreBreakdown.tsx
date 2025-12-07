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

  // Calculate sprint and race totals for display
  const getSprintTotal = (b: ScoreBreakdownType) =>
    b.sprint_1st_points + b.sprint_2nd_points + b.sprint_3rd_points
  const getRaceTotal = (b: ScoreBreakdownType) =>
    b.race_1st_points + b.race_2nd_points + b.race_3rd_points

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

          {/* Sprint Top 3 Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-orange-600 dark:text-orange-400">
                🏁 Sprint Race Top 3
              </h4>
              <span className={`font-bold ${getPointsColor(getSprintTotal(breakdown))}`}>
                +{getSprintTotal(breakdown)} pts
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sprint 1st */}
              <PredictionCard
                position="1st"
                prediction={breakdown.sprint_1st_prediction}
                actual={breakdown.sprint_1st_actual}
                points={breakdown.sprint_1st_points}
              />
              {/* Sprint 2nd */}
              <PredictionCard
                position="2nd"
                prediction={breakdown.sprint_2nd_prediction}
                actual={breakdown.sprint_2nd_actual}
                points={breakdown.sprint_2nd_points}
              />
              {/* Sprint 3rd */}
              <PredictionCard
                position="3rd"
                prediction={breakdown.sprint_3rd_prediction}
                actual={breakdown.sprint_3rd_actual}
                points={breakdown.sprint_3rd_points}
              />
            </div>
          </div>

          {/* Race Top 3 Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-red-600 dark:text-red-400">
                🏆 Grand Prix Top 3
              </h4>
              <span className={`font-bold ${getPointsColor(getRaceTotal(breakdown))}`}>
                +{getRaceTotal(breakdown)} pts
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Race 1st */}
              <PredictionCard
                position="1st"
                prediction={breakdown.race_1st_prediction}
                actual={breakdown.race_1st_actual}
                points={breakdown.race_1st_points}
              />
              {/* Race 2nd */}
              <PredictionCard
                position="2nd"
                prediction={breakdown.race_2nd_prediction}
                actual={breakdown.race_2nd_actual}
                points={breakdown.race_2nd_points}
              />
              {/* Race 3rd */}
              <PredictionCard
                position="3rd"
                prediction={breakdown.race_3rd_prediction}
                actual={breakdown.race_3rd_actual}
                points={breakdown.race_3rd_points}
              />
            </div>
          </div>

          {/* Glorious 7 Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-blue-600 dark:text-blue-400">
                7️⃣ Glorious 7 - Mini League
              </h4>
              <span className={`font-bold ${getPointsColor(breakdown.glorious_points)}`}>
                +{breakdown.glorious_points} pts
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PredictionCard
                position="G7 1st"
                prediction={breakdown.glorious_1st_prediction}
                actual={breakdown.glorious_1st_actual}
                points={breakdown.glorious_1st_points}
              />
              <PredictionCard
                position="G7 2nd"
                prediction={breakdown.glorious_2nd_prediction}
                actual={breakdown.glorious_2nd_actual}
                points={breakdown.glorious_2nd_points}
              />
              <PredictionCard
                position="G7 3rd"
                prediction={breakdown.glorious_3rd_prediction}
                actual={breakdown.glorious_3rd_actual}
                points={breakdown.glorious_3rd_points}
              />
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
                Sprint ({getSprintTotal(breakdown)}) + Race ({getRaceTotal(breakdown)}) + Glorious 7 (
                {breakdown.glorious_points})
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
 * Reusable prediction card component
 */
function PredictionCard({
  position,
  prediction,
  actual,
  points,
}: {
  position: string
  prediction?: string
  actual?: string
  points: number
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
          {position} Place
        </span>
        <span className={`font-bold ${getPointsColor(points)}`}>
          +{points}
        </span>
      </div>
      <div className="text-sm space-y-1">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Predicted: </span>
          <span className="font-medium">{prediction || 'N/A'}</span>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Actual: </span>
          <span className="font-medium text-green-600 dark:text-green-400">
            {actual || 'N/A'}
          </span>
        </div>
      </div>
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
