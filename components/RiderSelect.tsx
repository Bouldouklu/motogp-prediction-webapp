'use client'

import { Rider } from '@/types'

interface RiderSelectProps {
  label: string
  riders: Rider[]
  value: string
  onChange: (value: string) => void
  excludeIds?: string[]
  required?: boolean
}

export default function RiderSelect({
  label,
  riders,
  value,
  onChange,
  excludeIds = [],
  required = true,
}: RiderSelectProps) {
  const availableRiders = riders.filter(
    (rider) => !excludeIds.includes(rider.id) || rider.id === value
  )

  return (
    <div className="relative group">
      <label className="block text-xs font-bold uppercase tracking-wider text-motogp-red mb-1 font-display italic">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full px-4 py-3 bg-track-gray border-l-4 border-gray-700 text-white font-bold uppercase focus:outline-none focus:border-motogp-red focus:bg-gray-900 transition-all appearance-none rounded-r"
        >
          <option value="" className="bg-gray-900 text-gray-500">Select a rider...</option>
          {availableRiders.map((rider) => (
            <option key={rider.id} value={rider.id} className="bg-gray-900">
              #{rider.number} {rider.name} - {rider.team}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </div>
  )
}
