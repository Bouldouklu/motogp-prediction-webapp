import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LeaderboardTrendChart from '@/components/LeaderboardTrendChart'
import BetsTable from '@/components/BetsTable'
import PointsMatrixTable from '@/components/PointsMatrixTable'
import { getCurrentUser } from '@/lib/auth'

const PLAYER_COLORS = [
  "#EF4444", // Red
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#84CC16", // Lime
  "#14B8A6", // Teal
  "#E879F9", // Fuchsia
  "#FB7185", // Rose
  "#A3E635", // Lime bright
  "#38BDF8", // Sky
  "#FBBF24", // Yellow
]

export default async function LeaderboardPage() {
  const supabase = await createClient()

  // Fetch all necessary data
  const [
    { data: players },
    { data: races },
    { data: scores },
    { data: predictions }
  ] = await Promise.all([
    supabase.from('players').select('id, name'),
    supabase.from('races').select('*').order('round_number'),
    supabase.from('player_scores').select('*'),
    supabase.from('race_predictions').select(`
      player_id,
      race_id,
      sprint_1st:riders!race_predictions_sprint_1st_id_fkey(name, number),
      sprint_2nd:riders!race_predictions_sprint_2nd_id_fkey(name, number),
      sprint_3rd:riders!race_predictions_sprint_3rd_id_fkey(name, number),
      race_1st:riders!race_predictions_race_1st_id_fkey(name, number),
      race_2nd:riders!race_predictions_race_2nd_id_fkey(name, number),
      race_3rd:riders!race_predictions_race_3rd_id_fkey(name, number),
      glorious_1st:riders!race_predictions_glorious_1st_id_fkey(name, number),
      glorious_2nd:riders!race_predictions_glorious_2nd_id_fkey(name, number),
      glorious_3rd:riders!race_predictions_glorious_3rd_id_fkey(name, number)
    `)
  ])

  const currentUser = await getCurrentUser()
  const currentPlayerId = currentUser?.id ?? null

  const safePlayers = (players || []).filter(p => p.name.toLowerCase() !== 'admin')
  const safeRaces = races || []
  const safeScores = scores || []
  const safePredictions = predictions || []

  // Fetch actual results for past races
  const pastRaces = safeRaces.filter(r => r.status !== 'upcoming')
  const pastRaceIds = pastRaces.length > 0 ? pastRaces.map(r => r.id) : ['00000000-0000-0000-0000-000000000000']

  const [
    { data: raceResults },
    { data: gloriousRidersData },
    { data: allRaceResults },
  ] = await Promise.all([
    supabase
      .from('race_results')
      .select('race_id, result_type, position, rider:riders(name, number)')
      .in('race_id', pastRaceIds)
      .lte('position', 3)
      .order('position'),
    supabase
      .from('race_glorious_riders')
      .select('race_id, rider_id')
      .in('race_id', pastRaceIds),
    supabase
      .from('race_results')
      .select('race_id, rider_id, position, rider:riders(name, number)')
      .in('race_id', pastRaceIds)
      .eq('result_type', 'race')
      .order('position'),
  ])

  type RiderCellType = { name: string; number: number }
  type ActualResultsType = { sprint: (RiderCellType | null)[]; race: (RiderCellType | null)[]; glorious: (RiderCellType | null)[] }

  // Build G7 top-3 per race (relative ranking among the 7 selected riders)
  const g7RidersByRace: Record<string, string[]> = {}
  for (const row of (gloriousRidersData || [])) {
    if (!g7RidersByRace[row.race_id]) g7RidersByRace[row.race_id] = []
    g7RidersByRace[row.race_id].push(row.rider_id)
  }
  const g7ResultsMap: Record<string, (RiderCellType | null)[]> = {}
  for (const race of pastRaces) {
    const g7Ids = g7RidersByRace[race.id] || []
    const finishers = (allRaceResults || [])
      .filter((r: any) => r.race_id === race.id && g7Ids.includes(r.rider_id))
      .sort((a: any, b: any) => a.position - b.position)
    const toCell = (r: any): RiderCellType | null => {
      if (!r) return null
      const raw = Array.isArray(r.rider) ? r.rider[0] : r.rider
      return raw ?? null
    }
    g7ResultsMap[race.id] = [toCell(finishers[0]), toCell(finishers[1]), toCell(finishers[2])]
  }

  const resultsMap: Record<string, ActualResultsType> = {}
  for (const r of (raceResults || [])) {
    const rr = r as unknown as { race_id: string; result_type: string; position: number; rider: RiderCellType | RiderCellType[] }
    if (!resultsMap[rr.race_id]) resultsMap[rr.race_id] = { sprint: [null, null, null], race: [null, null, null], glorious: [null, null, null] }
    const idx = rr.position - 1
    const rider = Array.isArray(rr.rider) ? rr.rider[0] : rr.rider
    if (rr.result_type === 'sprint' && idx < 3) resultsMap[rr.race_id].sprint[idx] = rider ?? null
    if (rr.result_type === 'race' && idx < 3) resultsMap[rr.race_id].race[idx] = rider ?? null
  }
  // Attach G7 results to each race entry
  for (const race of pastRaces) {
    if (!resultsMap[race.id]) resultsMap[race.id] = { sprint: [null, null, null], race: [null, null, null], glorious: [null, null, null] }
    resultsMap[race.id].glorious = g7ResultsMap[race.id] ?? [null, null, null]
  }

  // 1. Calculate Leaderboard Stats
  const playerStats = safePlayers.map(player => {
    const playerScores = safeScores.filter(s => s.player_id === player.id)
    const totalPoints = playerScores.reduce((sum, s) => sum + (s.total_points || 0), 0)
    const totalPenalties = playerScores.reduce((sum, s) => sum + (s.penalty_points || 0), 0)

    return {
      id: player.id,
      name: player.name,
      totalPoints,
      totalPenalties
    }
  }).sort((a, b) => b.totalPoints - a.totalPoints)

  // Calculate differences
  const playerStatsWithDiffs = playerStats.map((stat, index) => {
    const leaderPoints = playerStats[0].totalPoints;
    const prevPlayerPoints = index > 0 ? playerStats[index - 1].totalPoints : stat.totalPoints;

    return {
      ...stat,
      diffToLeader: leaderPoints - stat.totalPoints,
      diffToPrev: prevPlayerPoints - stat.totalPoints
    };
  });

  // 2. Prepare Trend Data (Cumulative) — only races that have scores
  const completedRaces = safeRaces  // all races for the points table
  const racesWithScores = safeRaces.filter(r => safeScores.some(s => s.race_id === r.id))

  const trendData = racesWithScores.map(race => {
    const point: any = { race: race.country }

    safePlayers.forEach(player => {
      // Calculate cumulative score up to this race
      // Filter scores for this player and races up to current race round
      const playerCumulative = safeScores
        .filter(s => s.player_id === player.id)
        .filter(s => {
          const scoreRace = safeRaces.find(r => r.id === s.race_id)
          return scoreRace && scoreRace.round_number <= race.round_number
        })
        .reduce((sum, s) => sum + (s.total_points || 0), 0)

      point[player.name] = playerCumulative
    })
    return point
  })

  // 3. Prepare Chart Players Config
  const chartPlayers = safePlayers.map((p, index) => ({
    id: p.id,
    name: p.name,
    color: PLAYER_COLORS[index % PLAYER_COLORS.length]
  }))

  return (
    <main className="min-h-screen p-4 md:p-8 font-sans text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b-4 border-motogp-red pb-6">
          <div>
            <Link
              href="/dashboard"
              className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-white transition-colors mb-4 inline-block"
            >
              ← Back to Pit Lane
            </Link>
            <h1 className="text-5xl md:text-7xl font-display font-black italic tracking-tighter uppercase transform -skew-x-12 leading-none">
              Championship <span className="text-motogp-red">Standings</span>
            </h1>
            <p className="text-xl text-gray-400 mt-2 font-display font-bold tracking-widest uppercase pl-2">
              The Race for the Title
            </p>
          </div>
        </div>

        {playerStatsWithDiffs.length > 0 ? (
          <div className="space-y-12">

            {/* Main Leaderboard Table */}
            <div className="bg-track-gray rounded-xl border border-gray-800 overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-9xl font-display font-black italic pointer-events-none">
                RANK
              </div>

              <div className="relative z-10">
                <div className="grid grid-cols-12 gap-2 p-3 bg-black/40 text-[10px] uppercase text-gray-500 font-bold tracking-wider border-b border-gray-800">
                  <div className="col-span-1 text-center">Pos</div>
                  <div className="col-span-3">Rider</div>
                  <div className="col-span-2 text-center">Diff Ldr</div>
                  <div className="col-span-2 text-center">Diff Prv</div>
                  <div className="col-span-1 text-center text-red-500">Pen</div>
                  <div className="col-span-3 text-right pr-2">Pts</div>
                </div>

                <div className="divide-y divide-gray-800">
                  {playerStatsWithDiffs.map((entry, index) => (
                    <div key={entry.id} className={`grid grid-cols-12 gap-2 p-3 items-center transition-colors
                      ${index < 3 ? 'bg-gradient-to-r from-white/5 to-transparent' : ''}
                      ${entry.id === currentPlayerId ? 'bg-blue-950/40 border-l-2 border-blue-500' : 'hover:bg-white/5'}
                    `}>
                      <div className="col-span-1 text-center">
                        <span className={`font-display font-black italic text-lg ${
                          index === 0 ? 'text-yellow-400' :
                          index === 1 ? 'text-gray-400' :
                          index === 2 ? 'text-amber-700' : 'text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                      </div>
                      <div className="col-span-3 min-w-0">
                        <div className={`font-bold uppercase text-sm truncate ${entry.id === currentPlayerId ? 'text-blue-400' : ''}`}>{entry.name}</div>
                        {index === 0 && <div className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">Leader</div>}
                      </div>
                      <div className="col-span-2 text-center">
                        <div className="font-mono text-[11px] text-gray-400">{index === 0 ? '—' : `-${entry.diffToLeader}`}</div>
                      </div>
                      <div className="col-span-2 text-center">
                        <div className="font-mono text-[11px] text-gray-500">{index === 0 ? '—' : `-${entry.diffToPrev}`}</div>
                      </div>
                      <div className="col-span-1 text-center">
                        <div className={`font-mono text-[11px] ${entry.totalPenalties > 0 ? 'text-red-500 font-bold' : 'text-gray-700'}`}>
                          {entry.totalPenalties > 0 ? `-${entry.totalPenalties}` : '—'}
                        </div>
                      </div>
                      <div className="col-span-3 text-right pr-2">
                        <div className="font-display font-black italic text-xl text-motogp-red">{entry.totalPoints}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Championship Trend Graph */}
            <div>
              <h2 className="text-2xl font-display font-black italic uppercase mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-blue-500 skew-x-12 inline-block"></span>
                Championship Trend
              </h2>
              {trendData.length > 0 ? (
                <LeaderboardTrendChart data={trendData} players={chartPlayers} />
              ) : (
                <div className="p-8 bg-track-gray rounded-xl border border-gray-800 text-center text-gray-500 italic">
                  Not enough data to show trends yet.
                </div>
              )}
            </div>

            {/* Points Matrix Table */}
            <div>
              <h2 className="text-2xl font-display font-black italic uppercase mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-green-500 skew-x-12 inline-block"></span>
                Points Per Race
              </h2>
              <PointsMatrixTable
                playerStats={playerStats}
                races={completedRaces}
                scores={safeScores}
                currentPlayerId={currentPlayerId}
              />
            </div>

            {/* Weekend Bets Section — visible after cut-off */}
            {(() => {
              if (pastRaces.length === 0) return null

              const betsData = pastRaces.map(race => ({
                raceId: race.id,
                raceName: race.name,
                circuit: race.circuit,
                roundNumber: race.round_number,
                actualResults: resultsMap[race.id] ?? null,
                players: playerStats.map(player => {
                  const pred = safePredictions.find(
                    p => p.race_id === race.id && p.player_id === player.id
                  )
                  return {
                    playerId: player.id,
                    playerName: player.name,
                    sprint: pred ? [
                      pred.sprint_1st as any,
                      pred.sprint_2nd as any,
                      pred.sprint_3rd as any,
                    ] : null,
                    race: pred ? [
                      pred.race_1st as any,
                      pred.race_2nd as any,
                      pred.race_3rd as any,
                    ] : null,
                    glorious: pred ? [
                      pred.glorious_1st as any,
                      pred.glorious_2nd as any,
                      pred.glorious_3rd as any,
                    ] : null,
                  }
                }),
              }))

              return <BetsTable races={betsData} currentPlayerId={currentPlayerId} />
            })()}

          </div>
        ) : (
          <div className="p-12 bg-track-gray rounded-xl border border-gray-800 text-center">
            <p className="text-2xl font-display font-bold italic text-gray-500 uppercase mb-2">
              No standings yet
            </p>
            <p className="text-gray-400">
              The season hasn't started. Make your predictions to get on the board!
            </p>
            <div className="mt-6">
              <Link href="/dashboard" className="inline-block px-6 py-3 bg-motogp-red hover:bg-white hover:text-black text-white font-black italic uppercase tracking-wider transform -skew-x-12 transition-all">
                <span className="inline-block skew-x-12">Go to Dashboard</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
