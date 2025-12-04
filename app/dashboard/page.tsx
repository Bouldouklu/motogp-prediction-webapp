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
    <main className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Welcome, {user.name}!</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Ready to make your predictions?
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-2">Your Predictions</h3>
            <p className="text-3xl font-bold text-blue-600">
              {predictionsCount || 0}
            </p>
          </div>

          <Link
            href="/leaderboard"
            className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors"
          >
            <h3 className="text-lg font-semibold mb-2">Leaderboard</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View standings →
            </p>
          </Link>

          <Link
            href="/races"
            className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 transition-colors"
          >
            <h3 className="text-lg font-semibold mb-2">All Races</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View calendar →
            </p>
          </Link>

          {/* Championship Prediction CTA - Before deadline, not submitted */}
          {!championshipDeadlinePassed && !championshipPrediction && (
            <Link
              href="/championship"
              className="p-6 bg-gradient-to-br from-yellow-500 to-orange-600 text-white rounded-lg border-2 border-yellow-400 hover:border-yellow-300 transition-colors"
            >
              <h3 className="text-lg font-semibold mb-2">
                🏆 Championship Prediction
              </h3>
              <p className="text-sm opacity-90">
                Predict the final podium before {championshipDeadline.toLocaleDateString()}
              </p>
            </Link>
          )}

          {/* Championship Prediction - Already submitted */}
          {!championshipDeadlinePassed && championshipPrediction && (
            <Link
              href="/championship"
              className="p-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-green-500 dark:border-green-700 hover:border-green-600 transition-colors"
            >
              <h3 className="text-lg font-semibold mb-2 text-green-600 dark:text-green-400">
                ✓ Championship Prediction
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Submitted! Update before deadline →
              </p>
            </Link>
          )}
        </div>

        {/* Championship Prediction Display - After deadline or submitted */}
        {championshipPrediction && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Your Championship Prediction</h2>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                {championshipDeadlinePassed && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      🔒 Championship predictions are locked. Results will be scored at the end of the season.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-4 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="text-3xl">🥇</div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">1st Place</div>
                    <div className="text-lg font-bold">
                      {championshipPrediction.first_place?.name}
                      <span className="text-gray-500 dark:text-gray-400 ml-2">
                        #{championshipPrediction.first_place?.number}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {championshipPrediction.first_place?.team}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-3xl">🥈</div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">2nd Place</div>
                    <div className="text-lg font-bold">
                      {championshipPrediction.second_place?.name}
                      <span className="text-gray-500 dark:text-gray-400 ml-2">
                        #{championshipPrediction.second_place?.number}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {championshipPrediction.second_place?.team}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="text-3xl">🥉</div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">3rd Place</div>
                    <div className="text-lg font-bold">
                      {championshipPrediction.third_place?.name}
                      <span className="text-gray-500 dark:text-gray-400 ml-2">
                        #{championshipPrediction.third_place?.number}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {championshipPrediction.third_place?.team}
                    </div>
                  </div>
                </div>

                {!championshipDeadlinePassed && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Link
                      href="/championship"
                      className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                    >
                      Update prediction before {championshipDeadline.toLocaleDateString()} →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold mb-4">Upcoming Races</h2>
          {upcomingRaces && upcomingRaces.length > 0 ? (
            <div className="space-y-4">
              {upcomingRaces.map((race) => (
                <div
                  key={race.id}
                  className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold mb-1">
                        Round {race.round_number}: {race.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {race.circuit} • {race.country}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Race:</span>{' '}
                        {new Date(race.race_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Deadline:</span>{' '}
                        {new Date(race.fp1_datetime).toLocaleString()}
                      </p>
                    </div>
                    {predictedRaceIds.has(race.id) ? (
                      <Link
                        href={`/predict/${race.id}`}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                      >
                        ✓ Edit Prediction
                      </Link>
                    ) : (
                      <Link
                        href={`/predict/${race.id}`}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Make Prediction
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              No upcoming races at the moment.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
