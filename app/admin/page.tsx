import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ScoreCalculationPanel from '@/components/ScoreCalculationPanel'
import ChampionshipResultsForm from '@/components/ChampionshipResultsForm'
import PredictionStatusTable from '@/components/PredictionStatusTable'

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

  // Fetch race IDs that have results (for "Results ✓" badges on race cards)
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

      {/* Prediction status for next race */}
      {nextRace && allPlayers && allPlayers.length > 0 && (
        <PredictionStatusTable
          roundNumber={nextRace.round_number}
          raceName={nextRace.name}
          players={allPlayers.map((p: any) => {
            const pred = predictionsByPlayer.get(p.id)
            return { id: p.id, name: p.name, submitted: !!pred, isLate: pred?.is_late ?? false }
          })}
        />
      )}

      {/* Race Details — full width, race cards in a grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-1 text-gray-900 dark:text-gray-100">Upcoming Race Details</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Set Glorious 7 before the race · Enter results after
        </p>

        {racesNeedingResults && racesNeedingResults.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {racesNeedingResults.map((race: any) => {
              const hasResults = raceIdsWithResults.includes(race.id)
              return (
                <Link
                  key={race.id}
                  href={`/admin/results/${race.id}`}
                  className="flex flex-col gap-1 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                >
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Round {race.round_number}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">{race.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{race.country}</span>
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    {hasResults ? (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">Results ✓</span>
                    ) : (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">No results</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No upcoming races to manage.</p>
        )}
      </div>

      {/* Calculate Scores — full width, compact horizontal layout */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Calculate Scores</h2>
        <ScoreCalculationPanel />
      </div>

      {/* Completed Race Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-1 text-gray-900 dark:text-gray-100">Completed Race Details</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Click a race to correct results if needed
        </p>

        {completedRaces && completedRaces.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {completedRaces.map((race: any) => (
              <Link
                key={race.id}
                href={`/admin/results/${race.id}`}
                className="flex flex-col gap-1 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
              >
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Round {race.round_number}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">{race.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{race.country}</span>
                <div className="mt-1">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">Completed</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No completed races yet.</p>
        )}
      </div>

      {/* Championship Results */}
      <ChampionshipResultsForm riders={riders || []} seasonYear={2026} />
    </div>
  )
}
