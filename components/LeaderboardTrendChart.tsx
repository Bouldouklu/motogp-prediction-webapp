'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ChartDataPoint {
  race: string
  [key: string]: string | number
}

interface Player {
  id: string
  name: string
  color: string
}

interface Props {
  data: ChartDataPoint[]
  players: Player[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null

  const sorted = [...payload].sort((a, b) => (b.value as number) - (a.value as number))

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl text-xs min-w-[160px]">
      <p className="font-bold uppercase tracking-wider text-gray-400 mb-2">{label}</p>
      {sorted.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="truncate text-gray-200">{entry.dataKey}</span>
          </div>
          <span className="font-mono font-bold text-white shrink-0">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function LeaderboardTrendChart({ data, players }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function togglePlayer(name: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  const hasSelection = selected.size > 0

  return (
    <div className="bg-track-gray/50 rounded-xl border border-gray-800 p-4">
      <div className="h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="race"
              stroke="#9CA3AF"
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              interval={0}
            />
            <YAxis
              stroke="#9CA3AF"
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              domain={['auto', 'auto']}
              padding={{ top: 20, bottom: 0 }}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            {players.map((player) => {
              const dimmed = hasSelection && !selected.has(player.name)
              return (
                <Line
                  key={player.id}
                  type="monotone"
                  dataKey={player.name}
                  stroke={player.color}
                  strokeWidth={dimmed ? 1 : 2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  opacity={dimmed ? 0.15 : 1}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Clickable player legend */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {players.map(player => {
          const isActive = !hasSelection || selected.has(player.name)
          return (
            <button
              key={player.id}
              onClick={() => togglePlayer(player.name)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide transition-opacity ${isActive ? 'opacity-100' : 'opacity-30'}`}
            >
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: player.color }} />
              <span style={{ color: player.color }}>{player.name}</span>
            </button>
          )
        })}
      </div>
      {hasSelection && (
        <div className="mt-2 text-center">
          <button
            onClick={() => setSelected(new Set())}
            className="text-[10px] text-gray-500 hover:text-gray-300 uppercase tracking-wider transition-colors"
          >
            Clear filter
          </button>
        </div>
      )}
    </div>
  )
}
