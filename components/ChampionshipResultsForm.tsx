'use client'

import { useState, useEffect } from 'react'
import RiderSelect from './RiderSelect'
import { Rider } from '@/types'

interface ChampionshipResultsFormProps {
  riders: Rider[]
  seasonYear?: number
}

export default function ChampionshipResultsForm({
  riders,
  seasonYear = 2026,
}: ChampionshipResultsFormProps) {
  const [firstPlaceId, setFirstPlaceId] = useState('')
  const [secondPlaceId, setSecondPlaceId] = useState('')
  const [thirdPlaceId, setThirdPlaceId] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load existing results on mount
  useEffect(() => {
    async function loadExistingResults() {
      try {
        const response = await fetch(`/api/admin/championship-results?seasonYear=${seasonYear}`)
        const data = await response.json()

        if (response.ok && data.hasResults && data.results.length === 3) {
          const first = data.results.find((r: any) => r.position === 1)
          const second = data.results.find((r: any) => r.position === 2)
          const third = data.results.find((r: any) => r.position === 3)

          if (first) setFirstPlaceId(first.rider_id)
          if (second) setSecondPlaceId(second.rider_id)
          if (third) setThirdPlaceId(third.rider_id)
        }
      } catch (err) {
        console.error('Error loading existing results:', err)
      } finally {
        setLoadingExisting(false)
      }
    }

    loadExistingResults()
  }, [seasonYear])

  const handleSubmit = async () => {
    setError(null)
    setSuccess(null)

    // Validate
    if (!firstPlaceId || !secondPlaceId || !thirdPlaceId) {
      setError('Please select all 3 podium positions')
      return
    }

    const selectedRiders = [firstPlaceId, secondPlaceId, thirdPlaceId]
    const uniqueRiders = new Set(selectedRiders)
    if (uniqueRiders.size !== 3) {
      setError('Cannot select the same rider for multiple positions')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/championship-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seasonYear,
          firstPlaceId,
          secondPlaceId,
          thirdPlaceId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save championship results')
      }

      setSuccess(
        `Championship results saved! 🏆 1st: ${data.results.first}, 2nd: ${data.results.second}, 3rd: ${data.results.third}`
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save championship results')
    } finally {
      setLoading(false)
    }
  }

  if (loadingExisting) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Enter Final Championship Standings</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Enter the top 3 riders from the {seasonYear} season finale. This will calculate
          championship prediction points for all players.
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-200 text-sm">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Rider Selectors */}
      <div className="space-y-4">
        <RiderSelect
          label="🥇 1st Place Champion"
          riders={riders}
          value={firstPlaceId}
          onChange={setFirstPlaceId}
          excludeIds={[secondPlaceId, thirdPlaceId]}
          required={false}
        />

        <RiderSelect
          label="🥈 2nd Place"
          riders={riders}
          value={secondPlaceId}
          onChange={setSecondPlaceId}
          excludeIds={[firstPlaceId, thirdPlaceId]}
          required={false}
        />

        <RiderSelect
          label="🥉 3rd Place"
          riders={riders}
          value={thirdPlaceId}
          onChange={setThirdPlaceId}
          excludeIds={[firstPlaceId, secondPlaceId]}
          required={false}
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || !firstPlaceId || !secondPlaceId || !thirdPlaceId}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving...' : 'Save Championship Results'}
      </button>

      <div className="text-xs text-gray-500 dark:text-gray-500">
        Note: Saving will overwrite any existing championship results for {seasonYear}.
        Championship points will be automatically calculated and added to the leaderboard.
      </div>
    </div>
  )
}
