import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'

export default async function RacesPage() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  // Fetch all races grouped by status
  const { data: upcomingRaces } = await supabase
    .from('races')
    .select('*')
    .eq('status', 'upcoming')
    .order('round_number', { ascending: true })

  const { data: completedRaces } = await supabase
    .from('races')
    .select('*')
    .eq('status', 'completed')
    .order('round_number', { ascending: false })

  // Fetch user's predictions for upcoming races to check which ones are already done
  let predictedRaceIds = new Set<string>()
  if (user) {
    const upcomingRaceIds = upcomingRaces?.map(race => race.id) || []
    const { data: userPredictions } = await supabase
      .from('race_predictions')
      .select('race_id')
      .eq('player_id', user.id)
      .in('race_id', upcomingRaceIds)

    predictedRaceIds = new Set(userPredictions?.map(p => p.race_id) || [])
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">2026 Race Calendar</h1>
          <p className="text-gray-600 dark:text-gray-400">
            22 rounds around the world
          </p>
        </div>

        <div className="mb-4">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {upcomingRaces && upcomingRaces.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Upcoming Races</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingRaces.map((race) => (
                <div
                  key={race.id}
                  className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="mb-3">
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded">
                      Round {race.round_number}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{race.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {race.circuit}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Sprint:</span>{' '}
                    {new Date(race.sprint_date).toLocaleDateString()}
                  </p>
                  <p className="text-sm mb-1">
                    <span className="font-medium">Race:</span>{' '}
                    {new Date(race.race_date).toLocaleDateString()}
                  </p>
                  <p className="text-sm mb-4">
                    <span className="font-medium">Deadline:</span>{' '}
                    {new Date(race.fp1_datetime).toLocaleString()}
                  </p>
                  {predictedRaceIds.has(race.id) ? (
                    <Link
                      href={`/predict/${race.id}`}
                      className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      ✓ Edit Prediction
                    </Link>
                  ) : (
                    <Link
                      href={`/predict/${race.id}`}
                      className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Make Prediction
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {completedRaces && completedRaces.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Completed Races</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedRaces.map((race) => (
                <div
                  key={race.id}
                  className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="mb-3">
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded">
                      Round {race.round_number} - Completed
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{race.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {race.circuit}
                  </p>
                  <p className="text-sm mb-4">
                    <span className="font-medium">Race Date:</span>{' '}
                    {new Date(race.race_date).toLocaleDateString()}
                  </p>
                  <Link
                    href={`/races/${race.id}`}
                    className="inline-block px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                  >
                    View Results
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
