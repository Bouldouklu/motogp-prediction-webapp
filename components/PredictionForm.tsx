'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import RiderSelect from './RiderSelect'
import { Rider } from '@/types'

interface PredictionFormProps {
  raceId: string
  raceName: string
  riders: Rider[]
  gloriousRiders: Rider[]
  existingPrediction?: {
    sprint_1st_id: string
    sprint_2nd_id: string
    sprint_3rd_id: string
    race_1st_id: string
    race_2nd_id: string
    race_3rd_id: string
    glorious_1st_id?: string
    glorious_2nd_id?: string
    glorious_3rd_id?: string
    // backward compat
    glorious_7_id?: string
  } | null
  deadlineAt: string
}

export default function PredictionForm({
  raceId,
  raceName,
  riders,
  gloriousRiders,
  existingPrediction,
  deadlineAt,
}: PredictionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Sprint top 3 predictions
  const [sprint1stId, setSprint1stId] = useState(
    existingPrediction?.sprint_1st_id || ''
  )
  const [sprint2ndId, setSprint2ndId] = useState(
    existingPrediction?.sprint_2nd_id || ''
  )
  const [sprint3rdId, setSprint3rdId] = useState(
    existingPrediction?.sprint_3rd_id || ''
  )

  // Race top 3 predictions
  const [race1stId, setRace1stId] = useState(
    existingPrediction?.race_1st_id || ''
  )
  const [race2ndId, setRace2ndId] = useState(
    existingPrediction?.race_2nd_id || ''
  )
  const [race3rdId, setRace3rdId] = useState(
    existingPrediction?.race_3rd_id || ''
  )

  // Glorious 7 (Mini-League)
  const [glorious1stId, setGlorious1stId] = useState(
    existingPrediction?.glorious_1st_id || ''
  )
  const [glorious2ndId, setGlorious2ndId] = useState(
    existingPrediction?.glorious_2nd_id || ''
  )
  const [glorious3rdId, setGlorious3rdId] = useState(
    existingPrediction?.glorious_3rd_id || ''
  )

  const deadline = new Date(deadlineAt)
  const FP1_DURATION_MS = 45 * 60 * 1000
  const fp1End = new Date(deadline.getTime() + FP1_DURATION_MS)
  const nowMs = Date.now()
  const isInPenaltyWindow = nowMs >= deadline.getTime() && nowMs < fp1End.getTime()
  const isHardLocked = nowMs >= fp1End.getTime()
  const timeUntilDeadline = deadline.getTime() - nowMs

  const sprintIds = [sprint1stId, sprint2ndId, sprint3rdId]
  const raceIds = [race1stId, race2ndId, race3rdId]
  const gloriousIds = [glorious1stId, glorious2ndId, glorious3rdId]

  const g7Complete = glorious1stId !== '' && glorious2ndId !== '' && glorious3rdId !== ''
  const g7Available = gloriousRiders.length > 0

  const hasDuplicate = (ids: string[], id: string) =>
    id !== '' && ids.filter(x => x === id).length > 1

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate no duplicate riders within sprint predictions
    const sprintSelections = [sprint1stId, sprint2ndId, sprint3rdId].filter(Boolean)
    const uniqueSprintRiders = new Set(sprintSelections)
    if (uniqueSprintRiders.size !== sprintSelections.length) {
      setError('You cannot select the same rider for multiple sprint positions')
      setLoading(false)
      return
    }

    // Validate no duplicate riders within race predictions
    const raceSelections = [race1stId, race2ndId, race3rdId].filter(Boolean)
    const uniqueRaceRiders = new Set(raceSelections)
    if (uniqueRaceRiders.size !== raceSelections.length) {
      setError('You cannot select the same rider for multiple race positions')
      setLoading(false)
      return
    }

    // Validate no duplicate riders within glorious predictions
    const gloriousSelections = [glorious1stId, glorious2ndId, glorious3rdId].filter(Boolean)
    const uniqueGloriousRiders = new Set(gloriousSelections)
    if (uniqueGloriousRiders.size !== gloriousSelections.length) {
      setError('You cannot select the same rider for multiple Glorious 7 positions')
      setLoading(false)
      return
    }
    if (gloriousSelections.length > 0 && gloriousSelections.length < 3) {
      setError('Either fill all 3 Glorious 7 picks or leave all empty')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/predictions', {
        method: existingPrediction ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raceId,
          sprint1stId,
          sprint2ndId,
          sprint3rdId,
          race1stId,
          race2ndId,
          race3rdId,
          glorious1stId,
          glorious2ndId,
          glorious3rdId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save prediction')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1500)
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (isHardLocked) {
    return (
      <div className="p-6 bg-gray-900/50 border border-gray-700 rounded-lg">
        <h3 className="text-lg font-display italic font-bold text-gray-400 mb-2 uppercase">
          🔒 Locked
        </h3>
        <p className="text-gray-500">
          The prediction window for this race has closed. You can no longer
          submit or modify predictions.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-black/20 p-6 rounded-xl border border-gray-800">
      {isInPenaltyWindow && (
        <div className="mb-6 flex items-center gap-3 bg-amber-500/10 border border-amber-500/50 rounded-lg px-4 py-3">
          <span className="text-amber-400 text-lg shrink-0">⚠</span>
          <div>
            <p className="text-sm font-bold text-amber-400 uppercase tracking-wider">Late submission — penalty applies</p>
            <p className="text-xs text-amber-400/70">Your prediction will be accepted but a late penalty will be deducted from your score.</p>
          </div>
        </div>
      )}
      <div className="mb-8 p-4 bg-track-gray border-l-4 border-motogp-red rounded flex justify-between items-center">
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider shrink-0">
            Time Remaining
          </p>
          <p className="text-2xl font-mono font-bold text-white leading-none">
            {formatTimeRemaining(timeUntilDeadline)}
          </p>
        </div>
        <div className="text-right shrink-0 ml-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Deadline</p>
          <p className="text-sm font-bold text-motogp-red">{deadline.toLocaleString()}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sprint Race Top 3 */}
          <div className="md:col-span-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4">
              <span className="w-8 h-8 flex items-center justify-center bg-orange-500 text-black font-black italic rounded skew-x-12">S</span>
              <h3 className="text-xl font-display italic font-bold uppercase">Sprint Race - Top 3</h3>
              <p className="text-sm text-gray-500 italic">Predict the top 3 finishers of the Sprint Race.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <RiderSelect
                label="1st Place"
                riders={riders}
                value={sprint1stId}
                onChange={setSprint1stId}
                isDuplicate={hasDuplicate(sprintIds, sprint1stId)}
              />
              <RiderSelect
                label="2nd Place"
                riders={riders}
                value={sprint2ndId}
                onChange={setSprint2ndId}
                isDuplicate={hasDuplicate(sprintIds, sprint2ndId)}
              />
              <RiderSelect
                label="3rd Place"
                riders={riders}
                value={sprint3rdId}
                onChange={setSprint3rdId}
                isDuplicate={hasDuplicate(sprintIds, sprint3rdId)}
              />
            </div>
          </div>

          {/* Grand Prix Race Top 3 */}
          <div className="md:col-span-2 border-t border-gray-800 pt-6">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4">
              <span className="w-8 h-8 flex items-center justify-center bg-motogp-red text-white font-black italic rounded skew-x-12">R</span>
              <h3 className="text-xl font-display italic font-bold uppercase">Grand Prix Race - Top 3</h3>
              <p className="text-sm text-gray-500 italic">Predict the top 3 finishers of the Main Race.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <RiderSelect
                label="1st Place"
                riders={riders}
                value={race1stId}
                onChange={setRace1stId}
                isDuplicate={hasDuplicate(raceIds, race1stId)}
              />
              <RiderSelect
                label="2nd Place"
                riders={riders}
                value={race2ndId}
                onChange={setRace2ndId}
                isDuplicate={hasDuplicate(raceIds, race2ndId)}
              />
              <RiderSelect
                label="3rd Place"
                riders={riders}
                value={race3rdId}
                onChange={setRace3rdId}
                isDuplicate={hasDuplicate(raceIds, race3rdId)}
              />
            </div>
          </div>

          {/* Glorious 7 (Mini-League) */}
          <div className="md:col-span-2 border-t border-gray-800 pt-6">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4">
              <span className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white font-black italic rounded skew-x-12">G7</span>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-display italic font-bold uppercase">Glorious 7 - Mini League</h3>
              </div>
              <p className="text-sm text-gray-400 italic">
                {gloriousRiders.length > 0
                  ? "Predict the top 3 finishers among these 7 selected riders. You can save now and come back to fill this before FP1."
                  : "The Glorious 7 riders have not been selected for this race yet. You can still submit your Sprint & Race predictions."}
              </p>
            </div>

            {gloriousRiders.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <RiderSelect
                  label="G7 - 1st Place"
                  riders={gloriousRiders}
                  value={glorious1stId}
                  onChange={setGlorious1stId}
                  isDuplicate={hasDuplicate(gloriousIds, glorious1stId)}
                />
                <RiderSelect
                  label="G7 - 2nd Place"
                  riders={gloriousRiders}
                  value={glorious2ndId}
                  onChange={setGlorious2ndId}
                  isDuplicate={hasDuplicate(gloriousIds, glorious2ndId)}
                />
                <RiderSelect
                  label="G7 - 3rd Place"
                  riders={gloriousRiders}
                  value={glorious3rdId}
                  onChange={setGlorious3rdId}
                  isDuplicate={hasDuplicate(gloriousIds, glorious3rdId)}
                />
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-800 text-red-400 rounded font-bold">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-900/20 border border-green-800 text-green-400 rounded font-bold space-y-1">
            <div>✅ Prediction saved! Redirecting...</div>
            {g7Available && !g7Complete && (
              <div className="text-amber-400 text-sm font-medium">
                ⚠ Remember to come back and fill your Glorious 7 picks before FP1!
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || success}
          className="w-full px-4 py-4 bg-motogp-red hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-black italic uppercase text-xl tracking-wider transform -skew-x-12 transition-all shadow-lg hover:shadow-red-600/40 mt-8"
        >
          <span className="inline-block skew-x-12">
            {loading
              ? 'Saving...'
              : isInPenaltyWindow
                ? 'Submit Late (Penalty Applies)'
                : existingPrediction
                  ? 'Update Prediction'
                  : g7Available && !g7Complete
                    ? 'Submit (G7 incomplete)'
                    : 'Submit Prediction'}
          </span>
        </button>
      </form>
    </div>
  )
}

function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) return 'Deadline passed'

  const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24))
  const hours = Math.floor(
    (milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  )
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60))

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)

  return parts.join(' : ') || '< 1m'
}
