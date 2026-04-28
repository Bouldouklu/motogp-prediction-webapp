import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ScoreCalculationPanel from '@/components/ScoreCalculationPanel'
import ChampionshipResultsForm from '@/components/ChampionshipResultsForm'
import MarkRaceCompletedButton from '@/components/MarkRaceCompletedButton'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Fetch races needing results (upcoming or in progress)
  const { data: racesNeedingResults } = await supabase
    .from('races')
    .select('*')
    .in('status', ['upcoming', 'in_progress'])
    .order('round_number', { ascending: true })
    .limit(5)

  // Fetch completed races
  const { data: completedRaces } = await supabase
    .from('races')
    .select('*')
    .eq('status', 'completed')
    .order('round_number', { ascending: false })
    .limit(5)

  // Fetch all races for score calculation
  const { data: allRaces } = await supabase
    .from('races')
    .select('*')
    .order('round_number', { ascending: true })

  // Fetch race IDs that have results entered (to show in score calculation even if status isn't 'completed')
  const { data: racesWithResults } = await supabase
    .from('race_results')
    .select('race_id')

  const raceIdsWithResults = [...new Set((racesWithResults || []).map((r: { race_id: string }) => r.race_id))]

  // Fetch all riders for championship results
  const { data: riders } = await supabase
    .from('riders')
    .select('*')
    .eq('active', true)
    .order('number', { ascending: true })

  // Get stats
  const { count: totalRaces } = await supabase
    .from('races')
    .select('*', { count: 'exact', head: true })

  const { count: completedRacesCount } = await supabase
    .from('races')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')

  const { count: totalPlayers } = await supabase
    .from('players')
    .select('*', { count: 'exact', head: true })

  // Prediction status for the next upcoming race
  const nextRace = racesNeedingResults?.[0] ?? null
  const { data: allPlayers } = await supabase
    .from('players')
    .select('id, name')
    .neq('name', 'admin')
    .order('name', { ascending: true })

  const { data: predictionsForNextRace } = nextRace
    ? await supabase
        .from('race_predictions')
        .select('player_id, submitted_at, is_late')
        .eq('race_id', nextRace.id)
    : { data: [] }

  const predictionsByPlayer = new Map(
    (predictionsForNextRace || []).map((p: any) => [p.player_id, p])
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage race results, calculate scores, and administer players
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Races</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {totalRaces || 0}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Completed Races
          </div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {completedRacesCount || 0}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Players</div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {totalPlayers || 0}
          </div>
        </div>
      </div>

      {/* Prediction status for next race */}
      {nextRace && allPlayers && allPlayers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-1 text-gray-900 dark:text-gray-100">
            Predictions — Round {nextRace.round_number}: {nextRace.name}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {allPlayers.filter((p: any) => predictionsByPlayer.has(p.id)).length} / {allPlayers.length} submitted
          </p>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {allPlayers.map((player: any) => {
              const pred = predictionsByPlayer.get(player.id)
              return (
                <div key={player.id} className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {player.name}
                  </span>
                  {pred ? (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      pred.is_late
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    }`}>
                      {pred.is_late ? 'Late' : 'Done'}
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                      Missing
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Race Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Race Details</h2>

          {racesNeedingResults && racesNeedingResults.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Upcoming races — set Glorious 7 before the race, enter results after:
              </p>
              {racesNeedingResults.map((race: any) => {
                const hasResults = raceIdsWithResults.includes(race.id)
                return (
                  <div
                    key={race.id}
                    className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          Round {race.round_number}: {race.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {race.country} • {new Date(race.race_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {hasResults && <MarkRaceCompletedButton raceId={race.id} />}
                        <Link
                          href={`/admin/results/${race.id}`}
                          className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
                        >
                          Manage →
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              No upcoming races to manage.
            </p>
          )}
        </div>

        {/* Score Calculation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Calculate Scores</h2>
          <ScoreCalculationPanel races={allRaces || []} raceIdsWithResults={raceIdsWithResults} />
        </div>
      </div>

      {/* Championship Results */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Championship Results (End of Season)</h2>
        <ChampionshipResultsForm riders={riders || []} seasonYear={2026} />
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Recently Completed Races</h2>

        {completedRaces && completedRaces.length > 0 ? (
          <div className="space-y-3">
            {completedRaces.map((race: any) => (
              <div
                key={race.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      Round {race.round_number}: {race.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {race.country} • {new Date(race.race_date).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                    Completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No completed races yet.</p>
        )}
      </div>

      {/* Quick Links */}
      <div>
        <Link
          href="/"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">View Leaderboard</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            See current standings and player predictions
          </p>
        </Link>
      </div>
    </div>
  )
}
