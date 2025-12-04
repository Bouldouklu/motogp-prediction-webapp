'use client'

import { useEffect, useState } from 'react'

interface RaceHistory {
  race_id: string
  round_number: number
  race_name: string
  race_date: string
  status: string
  has_prediction: boolean
  prediction_submitted_at?: string
  is_late: boolean
  sprint_points: number | null
  race_points: number | null
  glorious_7_points: number | null
  penalty_points: number | null
  total_points: number | null
  running_total: number | null
  penalties: Array<{
    offense_number: number
    penalty_points: number
    reason: string
  }>
}

interface HistoryData {
  player: {
    id: string
    name: string
  }
  season: number
  summary: {
    total_races: number
    races_completed: number
    races_predicted: number
    total_points: number
    average_points_per_race: number
    late_submissions: number
    total_penalties: number
    total_penalty_points: number
  }
  history: RaceHistory[]
}

interface ScoreHistoryProps {
  playerId: string
}

export default function ScoreHistory({ playerId }: ScoreHistoryProps) {
  const [data, setData] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true)
        const response = await fetch(`/api/scores/history?playerId=${playerId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch score history')
        }

        const historyData = await response.json()
        setData(historyData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [playerId])

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

  if (!data) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-bold mb-4">
          {data.player.name} - {data.season} Season
        </h2>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {data.summary.total_points}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Points</div>
          </div>

          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {data.summary.average_points_per_race.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Per Race</div>
          </div>

          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {data.summary.races_predicted}/{data.summary.total_races}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Predictions Made</div>
          </div>

          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {data.summary.late_submissions}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Late Submissions</div>
          </div>
        </div>

        {data.summary.total_penalties > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-800 dark:text-red-200">
                Total Penalties: {data.summary.total_penalties}
              </span>
              <span className="font-semibold text-red-800 dark:text-red-200">
                -{data.summary.total_penalty_points} points
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Race-by-Race History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Round
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Race
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Sprint
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Race
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  G7
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Penalty
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Running Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.history.map((race) => (
                <tr
                  key={race.race_id}
                  className={
                    race.status === 'upcoming'
                      ? 'bg-gray-50 dark:bg-gray-900/50'
                      : race.is_late
                        ? 'bg-red-50 dark:bg-red-900/10'
                        : ''
                  }
                >
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {race.round_number}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {race.race_name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(race.race_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {race.status === 'completed' ? (
                      race.has_prediction ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          Scored
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                          No Pred
                        </span>
                      )
                    ) : race.has_prediction ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        Predicted
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium">
                    {race.sprint_points !== null ? race.sprint_points : '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium">
                    {race.race_points !== null ? race.race_points : '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium">
                    {race.glorious_7_points !== null ? race.glorious_7_points : '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium text-red-600 dark:text-red-400">
                    {race.penalty_points ? `-${race.penalty_points}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-bold">
                    {race.total_points !== null ? race.total_points : '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-bold text-blue-600 dark:text-blue-400">
                    {race.running_total !== null ? race.running_total : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
