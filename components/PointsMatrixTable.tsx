'use client'

import { useState } from 'react'
import { ScoreBreakdown } from '@/lib/scoring'

interface PlayerStat { id: string; name: string; totalPoints: number }
interface RaceRow { id: string; circuit: string; round_number: number; name: string }
interface ScoreRow {
  player_id: string; race_id: string; total_points: number
  sprint_1st_points: number; sprint_2nd_points: number; sprint_3rd_points: number
  race_1st_points: number; race_2nd_points: number; race_3rd_points: number
  glorious_7_points: number; penalty_points: number
}

interface PointsMatrixTableProps {
  playerStats: PlayerStat[]
  races: RaceRow[]
  scores: ScoreRow[]
}

export default function PointsMatrixTable({ playerStats, races, scores }: PointsMatrixTableProps) {
  const [modal, setModal] = useState<{ raceId: string; playerId: string; raceName: string; playerName: string } | null>(null)
  const [breakdown, setBreakdown] = useState<ScoreBreakdown | null>(null)
  const [loadingCell, setLoadingCell] = useState<string | null>(null)

  async function openBreakdown(raceId: string, playerId: string, raceName: string, playerName: string) {
    const key = `${raceId}-${playerId}`
    setLoadingCell(key)
    try {
      const res = await fetch(`/api/scores/breakdown?raceId=${raceId}&playerId=${playerId}`)
      const data = await res.json()
      const bd: ScoreBreakdown | undefined = data.breakdowns?.[0]
      if (bd) {
        setBreakdown(bd)
        setModal({ raceId, playerId, raceName, playerName })
      }
    } finally {
      setLoadingCell(null)
    }
  }

  function closeModal() {
    setModal(null)
    setBreakdown(null)
  }

  return (
    <>
      <div className="overflow-x-auto bg-track-gray rounded-xl border border-gray-800">
        <table className="min-w-full text-sm text-left">
          <thead className="text-xs text-gray-400 uppercase bg-black/40 border-b border-gray-800">
            <tr>
              <th className="px-6 py-4 font-bold sticky left-0 bg-[#1a1a1a] z-10">Player</th>
              {races.map(race => (
                <th key={race.id} className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span>{race.circuit}</span>
                    <span className="text-[10px] text-gray-600">Round {race.round_number}</span>
                  </div>
                </th>
              ))}
              <th className="px-6 py-4 text-right font-bold text-white sticky right-0 bg-[#1a1a1a] z-10 border-l border-gray-800">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {playerStats.map(player => (
              <tr key={player.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-bold text-white sticky left-0 bg-track-gray border-r border-gray-800">
                  {player.name}
                </td>
                {races.map(race => {
                  const score = scores.find(s => s.race_id === race.id && s.player_id === player.id)
                  const sprintTotal = score ? (score.sprint_1st_points + score.sprint_2nd_points + score.sprint_3rd_points) : 0
                  const raceTotal = score ? (score.race_1st_points + score.race_2nd_points + score.race_3rd_points) : 0
                  const gloriousTotal = score ? score.glorious_7_points : 0
                  const cellKey = `${race.id}-${player.id}`
                  const isLoading = loadingCell === cellKey
                  return (
                    <td
                      key={race.id}
                      className={`px-6 py-3 font-mono text-gray-300 text-center transition-colors ${score ? 'cursor-pointer hover:bg-motogp-red/20 hover:text-white' : ''}`}
                      onClick={() => score && openBreakdown(race.id, player.id, race.name, player.name)}
                      title={score ? `Click for ${player.name}'s ${race.name} breakdown` : undefined}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-3 h-3 rounded-full border-2 border-motogp-red border-t-transparent animate-spin" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span>{score ? score.total_points : 0}</span>
                          {score && (
                            <span className="text-[10px] text-gray-600 leading-none whitespace-nowrap">
                              S:{sprintTotal} R:{raceTotal} G:{gloriousTotal}
                            </span>
                          )}
                          {score && score.penalty_points > 0 && (
                            <span className="text-[10px] font-bold text-red-500 leading-none">
                              -{score.penalty_points}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  )
                })}
                <td className="px-6 py-4 font-black italic text-right text-motogp-red sticky right-0 bg-track-gray border-l border-gray-800">
                  {player.totalPoints}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {races.length === 0 && (
          <div className="p-8 text-center text-gray-500 italic">No races completed yet.</div>
        )}
      </div>

      {modal && breakdown && (
        <BreakdownModal
          breakdown={breakdown}
          raceName={modal.raceName}
          playerName={modal.playerName}
          onClose={closeModal}
        />
      )}
    </>
  )
}

function BreakdownModal({
  breakdown, raceName, playerName, onClose,
}: {
  breakdown: ScoreBreakdown
  raceName: string
  playerName: string
  onClose: () => void
}) {
  const sprintTotal = breakdown.sprint_1st_points + breakdown.sprint_2nd_points + breakdown.sprint_3rd_points
  const raceTotal = breakdown.race_1st_points + breakdown.race_2nd_points + breakdown.race_3rd_points

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-[#141414] border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{raceName}</p>
            <h3 className="text-2xl font-display font-black italic uppercase text-white">{playerName}</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Total</p>
              <p className="text-3xl font-display font-black italic text-motogp-red">{breakdown.total_points}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors p-2 rounded"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <CategorySection
            label="Sprint Race" accentColor="bg-orange-500" letterLabel="S" total={sprintTotal}
            slots={[
              { pos: '1st', prediction: breakdown.sprint_1st_prediction, actual: breakdown.sprint_1st_actual, points: breakdown.sprint_1st_points },
              { pos: '2nd', prediction: breakdown.sprint_2nd_prediction, actual: breakdown.sprint_2nd_actual, points: breakdown.sprint_2nd_points },
              { pos: '3rd', prediction: breakdown.sprint_3rd_prediction, actual: breakdown.sprint_3rd_actual, points: breakdown.sprint_3rd_points },
            ]}
          />
          <CategorySection
            label="Grand Prix" accentColor="bg-motogp-red" letterLabel="R" total={raceTotal}
            slots={[
              { pos: '1st', prediction: breakdown.race_1st_prediction, actual: breakdown.race_1st_actual, points: breakdown.race_1st_points },
              { pos: '2nd', prediction: breakdown.race_2nd_prediction, actual: breakdown.race_2nd_actual, points: breakdown.race_2nd_points },
              { pos: '3rd', prediction: breakdown.race_3rd_prediction, actual: breakdown.race_3rd_actual, points: breakdown.race_3rd_points },
            ]}
          />
          <CategorySection
            label="Glorious 7" accentColor="bg-blue-600" letterLabel="G7" total={breakdown.glorious_points}
            slots={[
              { pos: '1st', prediction: breakdown.glorious_1st_prediction, actual: breakdown.glorious_1st_actual, points: breakdown.glorious_1st_points },
              { pos: '2nd', prediction: breakdown.glorious_2nd_prediction, actual: breakdown.glorious_2nd_actual, points: breakdown.glorious_2nd_points },
              { pos: '3rd', prediction: breakdown.glorious_3rd_prediction, actual: breakdown.glorious_3rd_actual, points: breakdown.glorious_3rd_points },
            ]}
          />

          {breakdown.penalty_points > 0 && (
            <div className="flex items-center justify-between bg-red-950/30 border border-red-800/50 rounded-lg px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">Late Penalty</span>
              <span className="font-black italic text-red-400 text-lg">−{breakdown.penalty_points}</span>
            </div>
          )}

          <div className="flex items-center justify-between bg-black/40 rounded-lg px-4 py-3 text-xs text-gray-500 border border-gray-800">
            <span>
              S:{sprintTotal} + R:{raceTotal} + G:{breakdown.glorious_points}
              {breakdown.penalty_points > 0 ? ` − ${breakdown.penalty_points}` : ''}
            </span>
            <span className="font-bold text-white">= {breakdown.total_points} pts</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function CategorySection({ label, accentColor, letterLabel, total, slots }: {
  label: string; accentColor: string; letterLabel: string; total: number
  slots: { pos: string; prediction?: string; actual?: string; points: number }[]
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-7 h-7 flex items-center justify-center ${accentColor} text-white text-[10px] font-black italic rounded skew-x-12`}>
            {letterLabel}
          </span>
          <span className="text-sm font-bold uppercase tracking-wider text-gray-300">{label}</span>
        </div>
        <span className={`font-black italic text-lg ${total > 0 ? 'text-white' : 'text-gray-600'}`}>
          {total > 0 ? `+${total}` : '0'}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {slots.map(slot => <SlotCard key={slot.pos} {...slot} />)}
      </div>
    </div>
  )
}

function SlotCard({ pos, prediction, actual, points }: { pos: string; prediction?: string; actual?: string; points: number }) {
  const medals: Record<string, string> = { '1st': '🥇', '2nd': '🥈', '3rd': '🥉' }
  const ptColor = points >= 16 ? 'text-green-400' : points >= 10 ? 'text-blue-400' : points >= 6 ? 'text-yellow-400' : points > 0 ? 'text-orange-400' : 'text-gray-600'

  // "Jorge Martin (#89) - Finished P1" → "Martin #89"
  const fmt = (str?: string) => {
    if (!str) return '—'
    const m = str.match(/^(.+?)\s*\(#(\d+)\)/)
    if (m) return `${m[1].trim().split(' ').pop()} #${m[2]}`
    return str
  }

  return (
    <div className="bg-black/30 border border-gray-800 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          {medals[pos] || pos} {pos}
        </span>
        <span className={`text-sm font-black italic ${ptColor}`}>
          {points > 0 ? `+${points}` : '0'}
        </span>
      </div>
      <div className="text-xs space-y-1">
        <div className="flex items-start gap-1">
          <span className="text-gray-600 shrink-0">Pick</span>
          <span className="font-bold text-white truncate">{fmt(prediction)}</span>
        </div>
        <div className="flex items-start gap-1">
          <span className="text-gray-600 shrink-0">Real</span>
          <span className={`font-bold truncate ${actual ? 'text-green-400' : 'text-gray-600'}`}>{fmt(actual)}</span>
        </div>
      </div>
    </div>
  )
}
