import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import RaceResultsForm from '@/components/RaceResultsForm'

export default async function RaceResultsEntryPage({
  params,
}: {
  params: Promise<{ raceId: string }>
}) {
  const { raceId } = await params
  const supabase = await createClient()

  // Fetch race details
  const { data: race, error: raceError } = await supabase
    .from('races')
    .select('*')
    .eq('id', raceId)
    .single()

  if (raceError || !race) {
    notFound()
  }

  // Fetch all active riders
  const { data: riders, error: ridersError } = await supabase
    .from('riders')
    .select('*')
    .eq('active', true)
    .order('number', { ascending: true })

  if (ridersError || !riders) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-800 dark:text-red-200">Failed to load riders</p>
      </div>
    )
  }

  // Fetch existing results (if any)
  const { data: existingResults } = await supabase
    .from('race_results')
    .select('*')
    .eq('race_id', raceId)

  const existingSprintResults = existingResults?.filter((r) => r.result_type === 'sprint') || []
  const existingRaceResults = existingResults?.filter((r) => r.result_type === 'race') || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-3xl font-bold mb-2">Race Results Entry</h1>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
              Round {race.round_number}: {race.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {race.circuit} • {race.country}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {new Date(race.race_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                race.status === 'completed'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : race.status === 'in_progress'
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {race.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        {existingResults && existingResults.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              <strong>Note:</strong> This race already has results entered. Submitting will
              overwrite the existing results.
            </p>
          </div>
        )}
      </div>

      {/* Results Form */}
      <RaceResultsForm
        raceId={raceId}
        raceName={race.name}
        riders={riders}
        existingSprintResults={existingSprintResults}
        existingRaceResults={existingRaceResults}
      />
    </div>
  )
}
