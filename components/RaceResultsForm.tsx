'use client'

import { useState } from 'react'
import RiderSelect from './RiderSelect'
import { Rider, RaceResult } from '@/types'

interface RaceResultsFormProps {
  raceId: string
  raceName: string
  riders: Rider[]
  existingSprintResults?: RaceResult[]
  existingRaceResults?: RaceResult[]
}

interface ResultEntry {
  position: number
  riderId: string
}

export default function RaceResultsForm({
  raceId,
  raceName,
  riders,
  existingSprintResults = [],
  existingRaceResults = [],
}: RaceResultsFormProps) {
  // Initialize with existing results or empty arrays
  const [sprintResults, setSprintResults] = useState<ResultEntry[]>(
    existingSprintResults.length > 0
      ? existingSprintResults.map((r) => ({ position: r.position, riderId: r.rider_id }))
      : Array.from({ length: 15 }, (_, i) => ({ position: i + 1, riderId: '' }))
  )

  const [raceResults, setRaceResults] = useState<ResultEntry[]>(
    existingRaceResults.length > 0
      ? existingRaceResults.map((r) => ({ position: r.position, riderId: r.rider_id }))
      : Array.from({ length: 15 }, (_, i) => ({ position: i + 1, riderId: '' }))
  )

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const updateSprintResult = (position: number, riderId: string) => {
    setSprintResults((prev) =>
      prev.map((r) => (r.position === position ? { ...r, riderId } : r))
    )
    setError(null)
    setValidationErrors([])
  }

  const updateRaceResult = (position: number, riderId: string) => {
    setRaceResults((prev) =>
      prev.map((r) => (r.position === position ? { ...r, riderId } : r))
    )
    setError(null)
    setValidationErrors([])
  }

  const addMorePositions = (type: 'sprint' | 'race') => {
    const setter = type === 'sprint' ? setSprintResults : setRaceResults
    const current = type === 'sprint' ? sprintResults : raceResults
    const nextPosition = current.length + 1

    setter([...current, { position: nextPosition, riderId: '' }])
  }

  const validateResults = (results: ResultEntry[], type: string): string[] => {
    const errors: string[] = []

    // Filter out empty results
    const filledResults = results.filter((r) => r.riderId !== '')

    if (filledResults.length < 10) {
      errors.push(`${type}: Minimum 10 positions required (${filledResults.length} filled)`)
      return errors
    }

    // Check for duplicate riders
    const riderIds = filledResults.map((r) => r.riderId)
    const uniqueRiders = new Set(riderIds)
    if (riderIds.length !== uniqueRiders.size) {
      errors.push(`${type}: Duplicate riders found. Each rider can only finish in one position.`)
    }

    // Check for sequential positions (no gaps)
    const positions = filledResults.map((r) => r.position).sort((a, b) => a - b)
    for (let i = 0; i < positions.length; i++) {
      if (positions[i] !== i + 1) {
        errors.push(`${type}: Missing position ${i + 1}. Positions must be sequential (1, 2, 3...)`)
        break
      }
    }

    return errors
  }

  const handleValidate = () => {
    const errors: string[] = []

    const sprintErrors = validateResults(sprintResults, 'Sprint')
    const raceErrors = validateResults(raceResults, 'Race')

    errors.push(...sprintErrors, ...raceErrors)

    setValidationErrors(errors)

    if (errors.length === 0) {
      setSuccess('Validation passed! You can now submit the results.')
    } else {
      setSuccess(null)
    }
  }

  const handleSubmit = async () => {
    // Validate before submit
    const errors: string[] = []
    const sprintErrors = validateResults(sprintResults, 'Sprint')
    const raceErrors = validateResults(raceResults, 'Race')
    errors.push(...sprintErrors, ...raceErrors)

    if (errors.length > 0) {
      setValidationErrors(errors)
      setError('Please fix validation errors before submitting')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    setValidationErrors([])

    try {
      // Filter out empty results
      const sprintData = sprintResults
        .filter((r) => r.riderId !== '')
        .map((r) => ({ position: r.position, riderId: r.riderId }))

      const raceData = raceResults
        .filter((r) => r.riderId !== '')
        .map((r) => ({ position: r.position, riderId: r.riderId }))

      const response = await fetch('/api/admin/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raceId,
          sprintResults: sprintData,
          raceResults: raceData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save results')
      }

      setSuccess(
        `Results saved successfully! Sprint: ${data.sprintResultsCount} positions, Race: ${data.raceResultsCount} positions.`
      )

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = '/admin'
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save results')
    } finally {
      setLoading(false)
    }
  }

  // Get already selected rider IDs for exclusion
  const getExcludedRiders = (results: ResultEntry[], currentPosition: number) => {
    return results
      .filter((r) => r.position !== currentPosition && r.riderId !== '')
      .map((r) => r.riderId)
  }

  return (
    <div className="space-y-8">
      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-200">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200 font-semibold">{error}</p>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 font-semibold mb-2">
            Validation Errors:
          </p>
          <ul className="list-disc list-inside space-y-1">
            {validationErrors.map((err, idx) => (
              <li key={idx} className="text-yellow-700 dark:text-yellow-300 text-sm">
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sprint Results Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4">Sprint Results (Saturday)</h2>
        <div className="space-y-4">
          {sprintResults.map((result) => (
            <div key={result.position} className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-2 text-center">
                <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  P{result.position}
                </span>
              </div>
              <div className="col-span-10">
                <RiderSelect
                  label=""
                  riders={riders}
                  value={result.riderId}
                  onChange={(riderId) => updateSprintResult(result.position, riderId)}
                  excludeIds={getExcludedRiders(sprintResults, result.position)}
                  required={false}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => addMorePositions('sprint')}
          className="mt-4 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
        >
          + Add More Positions
        </button>
      </div>

      {/* Race Results Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4">Main Race Results (Sunday)</h2>
        <div className="space-y-4">
          {raceResults.map((result) => (
            <div key={result.position} className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-2 text-center">
                <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  P{result.position}
                </span>
              </div>
              <div className="col-span-10">
                <RiderSelect
                  label=""
                  riders={riders}
                  value={result.riderId}
                  onChange={(riderId) => updateRaceResult(result.position, riderId)}
                  excludeIds={getExcludedRiders(raceResults, result.position)}
                  required={false}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => addMorePositions('race')}
          className="mt-4 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
        >
          + Add More Positions
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => (window.location.href = '/admin')}
          disabled={loading}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>

        <button
          onClick={handleValidate}
          disabled={loading}
          className="px-6 py-3 border border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Validate Results
        </button>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Results'}
        </button>
      </div>
    </div>
  )
}
