import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()

  // Fetch upcoming races
  const { data: upcomingRaces } = await supabase
    .from('races')
    .select('*')
    .eq('status', 'upcoming')
    .order('round_number', { ascending: true })
    .limit(5)

  // Fetch user's predictions count
  const { count: predictionsCount } = await supabase
    .from('race_predictions')
    .select('*', { count: 'exact', head: true })
    .eq('player_id', user.id)

  // Fetch user's predictions for upcoming races to check which ones are already done
  const upcomingRaceIds = upcomingRaces?.map(race => race.id) || []
  const { data: userPredictions } = await supabase
    .from('race_predictions')
    .select('race_id')
    .eq('player_id', user.id)
    .in('race_id', upcomingRaceIds)

  // Create a Set of race IDs that have predictions for quick lookup
  const predictedRaceIds = new Set(userPredictions?.map(p => p.race_id) || [])

  // Fetch championship prediction status with rider details
  const { data: championshipPrediction } = await supabase
    .from('championship_predictions')
    .select(`
      *,
      first_place:riders!championship_predictions_first_place_id_fkey(name, number, team),
      second_place:riders!championship_predictions_second_place_id_fkey(name, number, team),
      third_place:riders!championship_predictions_third_place_id_fkey(name, number, team)
    `)
    .eq('player_id', user.id)
    .eq('season_year', 2026)
    .single()

  // Fetch first race for deadline
  const { data: firstRace } = await supabase
    .from('races')
    .select('fp1_datetime')
    .order('round_number', { ascending: true })
    .limit(1)
    .single()

  const championshipDeadline = new Date(firstRace?.fp1_datetime || '2026-03-01T00:00:00Z')
  const championshipDeadlinePassed = championshipDeadline < new Date()

  return (
    <main className="min-h-screen p-6 text-white font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-end border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-display font-black italic uppercase text-white transform -skew-x-12">
              Dashboard
            </h1>
            <p className="text-gray-400 mt-2 font-medium tracking-wide">
              Welcome, <span className="text-motogp-red font-bold">{user.name}</span>
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="p-6 bg-track-gray rounded-xl border-l-4 border-motogp-red border-y border-r border-gray-800 shadow-lg">
            <h3 className="text-sm uppercase tracking-wider text-gray-400 font-bold mb-2">My Predictions</h3>
            <p className="text-5xl font-display font-black italic text-white">
              {predictionsCount || 0}
            </p>
          </div>

          <Link
            href="/leaderboard"
            className="group p-6 bg-track-gray rounded-xl border border-gray-800 hover:border-motogp-red transition-all duration-200 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="text-6xl">🏆</span>
            </div>
            <h3 className="text-lg font-display font-bold uppercase italic mb-2 group-hover:text-motogp-red transition-colors">Leaderboard</h3>
            <p className="text-sm text-gray-400">
              View standings →
            </p>
          </Link>

          <Link
            href="/races"
            className="group p-6 bg-track-gray rounded-xl border border-gray-800 hover:border-motogp-red transition-all duration-200 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="text-6xl">📅</span>
            </div>
            <h3 className="text-lg font-display font-bold uppercase italic mb-2 group-hover:text-motogp-red transition-colors">Calendar</h3>
            <p className="text-sm text-gray-400">
              View all races →
            </p>
          </Link>

          {/* Championship Prediction CTA - Before deadline, not submitted */}
          {!championshipDeadlinePassed && !championshipPrediction && (
            <Link
              href="/championship"
              className="p-6 bg-gradient-to-br from-yellow-600 to-yellow-700 text-white rounded-xl border-2 border-yellow-500 hover:border-yellow-400 transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)]"
            >
              <h3 className="text-lg font-display font-black italic uppercase mb-2">
                🏆 Predict Champion
              </h3>
              <p className="text-xs font-bold uppercase opacity-90">
                Deadline: {championshipDeadline.toLocaleDateString()}
              </p>
            </Link>
          )}

          {/* Championship Prediction - Already submitted */}
          {!championshipDeadlinePassed && championshipPrediction && (
            <Link
              href="/championship"
              className="p-6 bg-track-gray rounded-xl border-2 border-green-600 hover:border-green-500 transition-colors"
            >
              <h3 className="text-lg font-display font-black italic uppercase mb-2 text-green-500">
                ✓ Submitted
              </h3>
              <p className="text-sm text-gray-400">
                Update before deadline →
              </p>
            </Link>
          )}
        </div>

        {/* Championship Prediction Display - After deadline or submitted */}
        {championshipPrediction && (
          <div className="mb-12">
            <h2 className="text-2xl font-display font-bold italic uppercase mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-motogp-red skew-x-12 inline-block"></span>
                Your Championship Prediction
            </h2>
            <div className="p-6 bg-track-gray rounded-xl border border-gray-800 relative overflow-hidden">
              <div className="space-y-4 relative z-10">
                {championshipDeadlinePassed && (
                  <div className="mb-4 p-3 bg-blue-900/30 border border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-300 font-medium">
                      🔒 Championship predictions are locked.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1st Place */}
                    <div className="p-4 bg-gradient-to-br from-gray-900 to-black border border-yellow-500/30 rounded-lg relative overflow-hidden">
                        <div className="absolute top-2 right-2 text-4xl opacity-20">🥇</div>
                        <div className="text-xs text-yellow-500 font-bold uppercase tracking-wider mb-1">Winner</div>
                        <div className="text-xl font-display font-black italic uppercase">{championshipPrediction.first_place?.name}</div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                             <span className="font-mono text-white">#{championshipPrediction.first_place?.number}</span>
                             <span>{championshipPrediction.first_place?.team}</span>
                        </div>
                    </div>

                    {/* 2nd Place */}
                    <div className="p-4 bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-lg relative overflow-hidden">
                        <div className="absolute top-2 right-2 text-4xl opacity-20">🥈</div>
                        <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Runner Up</div>
                        <div className="text-xl font-display font-black italic uppercase">{championshipPrediction.second_place?.name}</div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                             <span className="font-mono text-white">#{championshipPrediction.second_place?.number}</span>
                             <span>{championshipPrediction.second_place?.team}</span>
                        </div>
                    </div>

                    {/* 3rd Place */}
                    <div className="p-4 bg-gradient-to-br from-gray-900 to-black border border-orange-700/30 rounded-lg relative overflow-hidden">
                        <div className="absolute top-2 right-2 text-4xl opacity-20">🥉</div>
                        <div className="text-xs text-orange-500 font-bold uppercase tracking-wider mb-1">Third</div>
                        <div className="text-xl font-display font-black italic uppercase">{championshipPrediction.third_place?.name}</div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                             <span className="font-mono text-white">#{championshipPrediction.third_place?.number}</span>
                             <span>{championshipPrediction.third_place?.team}</span>
                        </div>
                    </div>
                </div>

                {!championshipDeadlinePassed && (
                  <div className="mt-4 pt-4 border-t border-gray-800 text-right">
                    <Link
                      href="/championship"
                      className="text-motogp-red hover:text-white font-bold uppercase text-sm tracking-wider transition-colors"
                    >
                      Update prediction →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-3xl font-display font-black italic uppercase mb-6 flex items-center gap-2">
            <span className="w-1 h-8 bg-motogp-red skew-x-12 inline-block"></span>
            Upcoming Races
          </h2>
          {upcomingRaces && upcomingRaces.length > 0 ? (
            <div className="space-y-4">
              {upcomingRaces.map((race) => (
                <div
                  key={race.id}
                  className="group p-6 bg-track-gray rounded-xl border border-gray-800 hover:border-gray-600 transition-all duration-200"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                          <span className="bg-gray-800 text-gray-300 text-xs font-bold uppercase px-2 py-0.5 rounded">Round {race.round_number}</span>
                      </div>
                      <h3 className="text-2xl font-display font-black italic uppercase text-white">
                        {race.name}
                      </h3>
                      <p className="text-sm text-gray-400 mb-2 font-medium">
                        {race.circuit} • {race.country}
                      </p>
                      <div className="flex gap-4 text-sm text-gray-500 mt-2">
                         <div>
                            <span className="text-motogp-red font-bold">RACE:</span> {new Date(race.race_date).toLocaleDateString()}
                         </div>
                         <div>
                            <span className="text-motogp-red font-bold">DEADLINE:</span> {new Date(race.fp1_datetime).toLocaleString()}
                         </div>
                      </div>
                    </div>
                    {predictedRaceIds.has(race.id) ? (
                      <Link
                        href={`/predict/${race.id}`}
                        className="w-full md:w-auto px-6 py-3 bg-green-600/20 border border-green-600 hover:bg-green-600 text-green-500 hover:text-white font-black uppercase italic tracking-wider rounded transform -skew-x-12 transition-all text-center"
                      >
                        <span className="inline-block skew-x-12">✓ Edit</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/predict/${race.id}`}
                        className="w-full md:w-auto px-6 py-3 bg-motogp-red hover:bg-white text-white hover:text-black font-black uppercase italic tracking-wider rounded shadow-lg shadow-red-900/20 transform -skew-x-12 transition-all text-center"
                      >
                        <span className="inline-block skew-x-12">Predict</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">
              No upcoming races at the moment.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
