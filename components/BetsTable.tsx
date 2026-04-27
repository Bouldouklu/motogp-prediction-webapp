'use client'

import { useState } from 'react'

interface RiderCell {
  name: string
  number: number
}

interface PlayerBets {
  playerId: string
  playerName: string
  sprint: (RiderCell | null)[] | null
  race: (RiderCell | null)[] | null
  glorious: (RiderCell | null)[] | null
}

interface RaceBets {
  raceId: string
  raceName: string
  circuit: string
  roundNumber: number
  players: PlayerBets[]
}

interface BetsTableProps {
  races: RaceBets[]
  currentPlayerId: string | null
}

const medals = ['🥇', '🥈', '🥉']

function riderCell(rider: RiderCell | null) {
  if (!rider) return <span className="text-gray-700 text-xs">—</span>
  return (
    <span className="font-display font-black italic uppercase text-white text-xs leading-tight">
      {rider.name.split(' ').pop()}
      <span className="font-mono font-normal not-italic normal-case text-gray-500 text-[10px] ml-1">#{rider.number}</span>
    </span>
  )
}

function RaceBlock({ raceBets, currentPlayerId }: { raceBets: RaceBets; currentPlayerId: string | null }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-full flex items-center justify-between px-5 py-4 bg-black/30 hover:bg-white/5 transition-colors group"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
            Round {raceBets.roundNumber}
          </span>
          <span className="text-xl font-display font-black italic uppercase text-white">
            {raceBets.raceName}
          </span>
          <span className="text-sm text-gray-500 hidden sm:inline">{raceBets.circuit}</span>
        </div>
        <span
          className={`text-gray-500 group-hover:text-gray-300 transition-all duration-200 ${open ? 'rotate-180' : 'rotate-0'}`}
          aria-hidden="true"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-[10px] text-gray-500 uppercase tracking-wider bg-black/20 border-b border-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-bold sticky left-0 bg-[#141414]">Player</th>
                {(['Sprint', 'Race', 'Glorious 7'] as const).map(cat => (
                  <th key={cat} className="px-4 py-3 text-left" colSpan={3}>
                    <span className="text-motogp-red">{cat}</span>
                  </th>
                ))}
              </tr>
              <tr className="border-b border-gray-800/50">
                <th className="px-4 pb-2 sticky left-0 bg-[#141414]"></th>
                {[...Array(3)].flatMap((_, catIdx) =>
                  medals.map((m, posIdx) => (
                    <th key={`${catIdx}-${posIdx}`} className="px-2 pb-2 text-[10px] text-gray-600 font-normal">
                      {m}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {raceBets.players.map(player => (
                <tr key={player.playerId} className={`transition-colors ${player.playerId === currentPlayerId ? 'bg-blue-950/40 border-l-2 border-blue-500' : 'hover:bg-white/5'}`}>
                  <td className={`px-4 py-3 font-bold sticky left-0 border-r border-gray-800 text-sm whitespace-nowrap ${player.playerId === currentPlayerId ? 'text-blue-400 bg-blue-950/60' : 'text-white bg-track-gray'}`}>
                    {player.playerName}
                  </td>
                  {([player.sprint, player.race, player.glorious] as ((RiderCell | null)[] | null)[]).flatMap((group, gIdx) =>
                    [0, 1, 2].map(pos => (
                      <td key={`${gIdx}-${pos}`} className="px-2 py-3 whitespace-nowrap">
                        {group ? riderCell(group[pos]) : <span className="text-gray-700 text-xs">—</span>}
                      </td>
                    ))
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function BetsTable({ races, currentPlayerId }: BetsTableProps) {
  return (
    <div>
      <h2 className="text-2xl font-display font-black italic uppercase mb-6 flex items-center gap-2">
        <span className="w-1 h-6 bg-motogp-red skew-x-12 inline-block"></span>
        Weekend Bets
      </h2>
      <div className="space-y-3">
        {races.map(race => (
          <RaceBlock key={race.raceId} raceBets={race} currentPlayerId={currentPlayerId} />
        ))}
      </div>
    </div>
  )
}
