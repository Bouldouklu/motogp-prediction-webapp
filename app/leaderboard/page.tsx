import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LeaderboardTrendChart from '@/components/LeaderboardTrendChart'

const PLAYER_COLORS = [
  "#EF4444", // Red
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#84CC16", // Lime
]

export default async function LeaderboardPage() {
  const supabase = await createClient()

  // Fetch all necessary data
  const [
    { data: players },
    { data: races },
    { data: scores }
  ] = await Promise.all([
    supabase.from('players').select('id, name'),
    supabase.from('races').select('*').order('round_number'),
    supabase.from('player_scores').select('*')
  ])

  const safePlayers = players || []
  const safeRaces = races || []
  const safeScores = scores || []

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

  // 2. Prepare Trend Data (Cumulative)
  const completedRaces = safeRaces.filter(r => 
    safeScores.some(s => s.race_id === r.id)
  )

  const trendData = completedRaces.map(race => {
    const point: any = { race: race.circuit } // Use circuit name for X-axis
    
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

        {playerStats.length > 0 ? (
          <div className="space-y-12">
            
            {/* Main Leaderboard Table */}
            <div className="bg-track-gray rounded-xl border border-gray-800 overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 right-0 p-4 opacity-5 text-9xl font-display font-black italic pointer-events-none">
                    RANK
                </div>

                <div className="relative z-10">
                    <div className="grid grid-cols-12 gap-4 p-4 bg-black/40 text-xs uppercase text-gray-500 font-bold tracking-wider border-b border-gray-800">
                        <div className="col-span-2 md:col-span-1 text-center">Pos</div>
                        <div className="col-span-6 md:col-span-5">Rider</div>
                        <div className="hidden md:block col-span-3 text-center">Penalties</div>
                        <div className="col-span-4 md:col-span-3 text-right pr-4">Total Points</div>
                    </div>

                    <div className="divide-y divide-gray-800">
                        {playerStats.map((entry, index) => (
                            <div key={entry.id} className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors ${index < 3 ? 'bg-gradient-to-r from-white/5 to-transparent' : ''}`}>
                                <div className="col-span-2 md:col-span-1 text-center">
                                    <span className={`font-display font-black italic text-2xl md:text-3xl ${
                                        index === 0 ? 'text-yellow-400' : 
                                        index === 1 ? 'text-gray-400' : 
                                        index === 2 ? 'text-amber-700' : 'text-gray-600'
                                    }`}>
                                        {index + 1}
                                    </span>
                                </div>
                                <div className="col-span-6 md:col-span-5">
                                    <div className="font-bold uppercase text-lg md:text-xl truncate">{entry.name}</div>
                                    {index === 0 && <div className="text-xs text-yellow-500 font-bold uppercase tracking-wider">Current Leader</div>}
                                </div>
                                <div className="hidden md:block col-span-3 text-center">
                                    <div className="font-mono text-red-400 font-bold">{entry.totalPenalties > 0 ? `-${entry.totalPenalties}` : '-'}</div>
                                </div>
                                <div className="col-span-4 md:col-span-3 text-right pr-4">
                                    <div className="font-display font-black italic text-3xl text-motogp-red">{entry.totalPoints}</div>
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
                Points per Race
              </h2>
              <div className="overflow-x-auto bg-track-gray rounded-xl border border-gray-800">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-400 uppercase bg-black/40 border-b border-gray-800">
                    <tr>
                      <th className="px-6 py-4 font-bold sticky left-0 bg-[#1a1a1a] z-10">Player</th>
                      {completedRaces.map(race => (
                        <th key={race.id} className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span>{race.circuit}</span>
                            <span className="text-[10px] text-gray-600">Round {race.round_number}</span>
                          </div>
                        </th>
                      ))}
                      <th className="px-6 py-4 text-right font-bold text-white">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {playerStats.map(player => (
                      <tr key={player.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-white sticky left-0 bg-track-gray border-r border-gray-800">
                          {player.name}
                        </td>
                        {completedRaces.map(race => {
                           const score = safeScores.find(s => s.race_id === race.id && s.player_id === player.id)
                           return (
                             <td key={race.id} className="px-6 py-4 font-mono text-gray-300 text-center">
                               {score?.total_points || '-'}
                             </td>
                           )
                        })}
                        <td className="px-6 py-4 font-black italic text-right text-motogp-red border-l border-gray-800">
                          {player.totalPoints}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {completedRaces.length === 0 && (
                    <div className="p-8 text-center text-gray-500 italic">
                        No races completed yet.
                    </div>
                )}
              </div>
            </div>

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
