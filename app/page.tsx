import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()

  // Fetch leaderboard data from view
  const { data: leaderboard } = await supabase
    .from('leaderboard')
    .select('*')
    .order('total_points', { ascending: false })

  // Fetch the last completed race
  const { data: lastCompletedRaces } = await supabase
    .from('races')
    .select('*')
    .eq('status', 'completed')
    .order('round_number', { ascending: false })
    .limit(1)

  const lastRace = lastCompletedRaces?.[0] || null

  // Fetch results for the last completed race (sprint and race)
  type RaceResult = { position: number; rider: { name: string; number: number } | null }
  let sprintResults: RaceResult[] = []
  let raceResults: RaceResult[] = []

  if (lastRace) {
    const { data: sprintData } = await supabase
      .from('race_results')
      .select('position, rider:riders(name, number)')
      .eq('race_id', lastRace.id)
      .eq('result_type', 'sprint')
      .order('position', { ascending: true })
      .limit(3)

    const { data: raceData } = await supabase
      .from('race_results')
      .select('position, rider:riders(name, number)')
      .eq('race_id', lastRace.id)
      .eq('result_type', 'race')
      .order('position', { ascending: true })
      .limit(3)

    // Transform the data to match our expected type (Supabase returns rider as array for single relation)
    sprintResults = (sprintData || []).map((item: { position: number; rider: unknown }) => ({
      position: item.position,
      rider: Array.isArray(item.rider) ? item.rider[0] : item.rider
    })) as RaceResult[]
    
    raceResults = (raceData || []).map((item: { position: number; rider: unknown }) => ({
      position: item.position,
      rider: Array.isArray(item.rider) ? item.rider[0] : item.rider
    })) as RaceResult[]
  }

  // Fetch the next upcoming race
  const { data: upcomingRaces } = await supabase
    .from('races')
    .select('*')
    .eq('status', 'upcoming')
    .order('round_number', { ascending: true })
    .limit(1)

  const nextRace = upcomingRaces?.[0] || null

  return (
    <main className="min-h-screen p-4 md:p-8 font-sans text-white">
      {/* Hero Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row justify-between items-end border-b-4 border-motogp-red pb-6">
          <div>
            <h1 className="text-6xl md:text-9xl font-display font-black italic tracking-tighter uppercase transform -skew-x-12 leading-none">
              MotoGP <span className="text-motogp-red">Bet</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mt-2 font-display font-bold tracking-widest uppercase pl-2">
              Official Prediction Championship
            </p>
          </div>
          <Link
            href="/login"
            className="mt-8 md:mt-0 group relative inline-flex items-center justify-center px-8 py-3 font-display font-black italic text-xl uppercase tracking-wider text-white transition-all duration-200 bg-motogp-red hover:bg-white hover:text-black -skew-x-12 shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
          >
            <span className="transform skew-x-12">Login / Play</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Next Race Card */}
          {nextRace && (
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-track-gray to-black border border-gray-800 shadow-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl font-display font-black italic">
                {nextRace.round_number}
              </div>
              
              <div className="relative z-10 p-1 bg-gradient-to-r from-motogp-red to-transparent">
                 <div className="bg-black/40 backdrop-blur-sm p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-motogp-red text-white text-xs font-bold uppercase px-2 py-1 -skew-x-12">Next Round</span>
                        <span className="text-gray-400 font-mono uppercase text-sm">Round {nextRace.round_number}</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-display font-black italic uppercase mb-2 leading-none">
                        {nextRace.name}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-gray-300 mb-6 font-medium">
                        <div className="flex items-center gap-2">
                            <span className="text-motogp-red">📍</span> {nextRace.circuit}, {nextRace.country}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-800 pt-6">
                        <div className="bg-gray-900/50 p-3 rounded border-l-2 border-motogp-red">
                            <div className="text-xs text-gray-500 uppercase font-bold">Sprint Race</div>
                            <div className="text-lg font-display font-bold">
                                {new Date(nextRace.sprint_date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </div>
                        </div>
                        <div className="bg-gray-900/50 p-3 rounded border-l-2 border-white">
                            <div className="text-xs text-gray-500 uppercase font-bold">Grand Prix</div>
                            <div className="text-lg font-display font-bold">
                                {new Date(nextRace.race_date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </div>
                        </div>
                        <div className="bg-motogp-red/10 p-3 rounded border-l-2 border-motogp-red">
                            <div className="text-xs text-motogp-red uppercase font-bold">Lockout (FP1)</div>
                            <div className="text-lg font-display font-bold text-white">
                                {new Date(nextRace.fp1_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </div>
                        </div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {/* Last Race Results */}
          {lastRace && (sprintResults.length > 0 || raceResults.length > 0) && (
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-8 w-2 bg-motogp-red skew-x-12"></div>
                <h2 className="text-3xl font-display font-black italic uppercase">Last Results</h2>
              </div>
              
              <div className="bg-track-gray border border-gray-800 rounded-xl overflow-hidden">
                <div className="bg-black/50 p-4 border-b border-gray-700 flex justify-between items-center">
                    <div>
                        <span className="text-motogp-red font-bold uppercase text-sm tracking-wider">Round {lastRace.round_number}</span>
                        <h3 className="text-2xl font-display font-bold italic">{lastRace.name}</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800">
                    {/* Sprint */}
                    {sprintResults.length > 0 && (
                    <div className="p-4">
                        <h4 className="text-orange-500 font-display font-bold italic text-xl mb-4 uppercase flex items-center gap-2">
                             Sprint
                        </h4>
                        <div className="space-y-2">
                        {sprintResults.filter(r => r.rider).map((result, index) => (
                            <div key={result.position} className="flex items-center justify-between p-2 bg-gray-900/50 rounded border-l-4 border-transparent hover:border-orange-500 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className={`font-display font-bold text-xl w-6 text-center ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-700' : 'text-gray-600'}`}>{result.position}</span>
                                    <div>
                                        <div className="text-xs text-gray-500 font-mono">#{result.rider!.number}</div>
                                        <div className="font-bold uppercase">{result.rider!.name}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
                    )}

                    {/* Race */}
                    {raceResults.length > 0 && (
                    <div className="p-4">
                        <h4 className="text-motogp-red font-display font-bold italic text-xl mb-4 uppercase flex items-center gap-2">
                            GP Race
                        </h4>
                        <div className="space-y-2">
                        {raceResults.filter(r => r.rider).map((result, index) => (
                            <div key={result.position} className="flex items-center justify-between p-2 bg-gray-900/50 rounded border-l-4 border-transparent hover:border-motogp-red transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className={`font-display font-bold text-xl w-6 text-center ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-700' : 'text-gray-600'}`}>{result.position}</span>
                                    <div>
                                        <div className="text-xs text-gray-500 font-mono">#{result.rider!.number}</div>
                                        <div className="font-bold uppercase">{result.rider!.name}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
                    )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Leaderboard */}
        <div className="lg:col-span-1">
            <div className="bg-track-gray rounded-xl border border-gray-800 overflow-hidden shadow-xl sticky top-4">
                <div className="bg-motogp-red p-4">
                    <h2 className="text-2xl font-display font-black italic uppercase text-white text-center">Championship Standings</h2>
                </div>
                
                {leaderboard && leaderboard.length > 0 ? (
                    <div className="divide-y divide-gray-800">
                         <div className="grid grid-cols-12 gap-2 p-2 bg-black/40 text-xs uppercase text-gray-500 font-bold tracking-wider">
                            <div className="col-span-2 text-center">Pos</div>
                            <div className="col-span-7">Rider</div>
                            <div className="col-span-3 text-center">Pts</div>
                         </div>
                         {leaderboard.map((entry, index) => (
                            <div key={entry.player_id} className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-gray-800 transition-colors">
                                <div className="col-span-2 text-center">
                                    <span className={`font-display font-bold text-xl ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>
                                        {index + 1}
                                    </span>
                                </div>
                                <div className="col-span-7">
                                    <div className="font-bold uppercase truncate text-sm md:text-base">{entry.name}</div>
                                    <div className="text-xs text-gray-500">Race: {entry.race_points} | Champ: {entry.championship_points}</div>
                                </div>
                                <div className="col-span-3 text-center">
                                    <div className="font-display font-black text-xl text-motogp-red">{entry.total_points}</div>
                                </div>
                            </div>
                         ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        <p>No standings yet.</p>
                        <p className="text-sm mt-2">Season starts soon!</p>
                    </div>
                )}
            </div>
        </div>

      </div>
    </main>
  );
}
