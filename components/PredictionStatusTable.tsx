'use client'

import { useState } from 'react'

interface PlayerPrediction {
  id: string
  name: string
  submitted: boolean
  isLate: boolean
}

interface Props {
  roundNumber: number
  raceName: string
  players: PlayerPrediction[]
}

export default function PredictionStatusTable({ roundNumber, raceName, players }: Props) {
  const [open, setOpen] = useState(false)
  const submittedCount = players.filter(p => p.submitted).length

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Predictions — Round {roundNumber}: {raceName}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {submittedCount} / {players.length} submitted
          </p>
        </div>
        <span className="text-gray-400 dark:text-gray-500 text-lg ml-4">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div className="px-6 pb-6 divide-y divide-gray-100 dark:divide-gray-700">
          {players.map(player => (
            <div key={player.id} className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {player.name}
              </span>
              {player.submitted ? (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  player.isLate
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                }`}>
                  {player.isLate ? 'Late' : 'Done'}
                </span>
              ) : (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                  Missing
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
