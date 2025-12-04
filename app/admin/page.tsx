import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ScoreCalculationPanel from '@/components/ScoreCalculationPanel'

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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Enter Results */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-4">Enter Race Results</h2>

          {racesNeedingResults && racesNeedingResults.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Races needing results:
              </p>
              {racesNeedingResults.map((race: any) => (
                <Link
                  key={race.id}
                  href={`/admin/results/${race.id}`}
                  className="block p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        Round {race.round_number}: {race.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {race.country} • {new Date(race.race_date).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                      Enter →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              All upcoming races have results entered.
            </p>
          )}
        </div>

        {/* Score Calculation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-4">Calculate Scores</h2>
          <ScoreCalculationPanel races={allRaces || []} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4">Recently Completed Races</h2>

        {completedRaces && completedRaces.length > 0 ? (
          <div className="space-y-3">
            {completedRaces.map((race: any) => (
              <div
                key={race.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/admin/players"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <h3 className="text-lg font-semibold mb-2">Player Management</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Create players, reset passphrases, and apply penalties
          </p>
        </Link>

        <Link
          href="/"
          className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <h3 className="text-lg font-semibold mb-2">View Leaderboard</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            See current standings and player predictions
          </p>
        </Link>
      </div>
    </div>
  )
}
