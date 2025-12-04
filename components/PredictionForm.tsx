'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import RiderSelect from './RiderSelect'
import { Rider } from '@/types'

interface PredictionFormProps {
  raceId: string
  raceName: string
  riders: Rider[]
  existingPrediction?: {
    sprint_winner_id: string
    race_winner_id: string
    glorious_7_id: string
  } | null
  deadlineAt: string
}

export default function PredictionForm({
  raceId,
  raceName,
  riders,
  existingPrediction,
  deadlineAt,
}: PredictionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [sprintWinnerId, setSprintWinnerId] = useState(
    existingPrediction?.sprint_winner_id || ''
  )
  const [raceWinnerId, setRaceWinnerId] = useState(
    existingPrediction?.race_winner_id || ''
  )
  const [glorious7Id, setGlorious7Id] = useState(
    existingPrediction?.glorious_7_id || ''
  )

  const deadline = new Date(deadlineAt)
  const isPastDeadline = deadline < new Date()
  const timeUntilDeadline = deadline.getTime() - Date.now()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validate no duplicate riders
    const selectedRiders = [sprintWinnerId, raceWinnerId, glorious7Id]
    const uniqueRiders = new Set(selectedRiders.filter(Boolean))
    if (uniqueRiders.size !== selectedRiders.filter(Boolean).length) {
      setError('You cannot select the same rider for multiple predictions')
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
          sprintWinnerId,
          raceWinnerId,
          glorious7Id,
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

  if (isPastDeadline) {
    return (
      <div className="p-6 bg-red-900/20 border border-red-800 rounded-lg">
        <h3 className="text-lg font-display italic font-bold text-red-500 mb-2 uppercase">
          Deadline Passed
        </h3>
        <p className="text-gray-400">
          The prediction deadline for this race has passed. You can no longer
          submit or modify predictions.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-black/20 p-6 rounded-xl border border-gray-800">
      <div className="mb-8 p-4 bg-track-gray border-l-4 border-motogp-red rounded flex justify-between items-center">
        <div>
             <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
               Time Remaining
             </p>
             <p className="text-2xl font-mono font-bold text-white">
               {formatTimeRemaining(timeUntilDeadline)}
             </p>
        </div>
        <div className="text-right">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Deadline</p>
            <p className="text-sm font-bold text-motogp-red">{deadline.toLocaleString()}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
                 <div className="flex items-center gap-2 mb-4">
                    <span className="w-8 h-8 flex items-center justify-center bg-orange-500 text-black font-black italic rounded skew-x-12">S</span>
                    <h3 className="text-xl font-display italic font-bold uppercase">Sprint Race</h3>
                 </div>
                 <RiderSelect
                    label="Winner Prediction"
                    riders={riders}
                    value={sprintWinnerId}
                    onChange={setSprintWinnerId}
                    excludeIds={[raceWinnerId, glorious7Id]}
                  />
            </div>

            <div className="md:col-span-2 border-t border-gray-800 pt-6">
                 <div className="flex items-center gap-2 mb-4">
                    <span className="w-8 h-8 flex items-center justify-center bg-motogp-red text-white font-black italic rounded skew-x-12">R</span>
                    <h3 className="text-xl font-display italic font-bold uppercase">Grand Prix Race</h3>
                 </div>
                 <RiderSelect
                  label="Winner Prediction"
                  riders={riders}
                  value={raceWinnerId}
                  onChange={setRaceWinnerId}
                  excludeIds={[sprintWinnerId, glorious7Id]}
                />
            </div>

            <div className="md:col-span-2 border-t border-gray-800 pt-6">
                 <div className="flex items-center gap-2 mb-4">
                    <span className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white font-black italic rounded skew-x-12">7</span>
                    <h3 className="text-xl font-display italic font-bold uppercase">Glorious 7th</h3>
                 </div>
                 <p className="text-sm text-gray-500 mb-4 italic">Predict who will finish exactly in 7th place.</p>
                 <RiderSelect
                  label="7th Place Prediction"
                  riders={riders}
                  value={glorious7Id}
                  onChange={setGlorious7Id}
                  excludeIds={[sprintWinnerId, raceWinnerId]}
                />
            </div>
        </div>

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-800 text-red-400 rounded font-bold">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-900/20 border border-green-800 text-green-400 rounded font-bold">
            ✅ Prediction saved successfully! Redirecting...
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
            : existingPrediction
            ? 'Update Prediction'
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
