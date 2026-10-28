import {
  calculateAllRaceScores,
  validateRaceResults,
  countLateSubmissions,
  type LateSubmission,
  type RacePrediction,
  type RaceResult,
} from '@/lib/scoring'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface RaceScoreResult {
  raceId: string
  scoresCalculated: number
  penaltiesApplied: number
  error?: string
}

interface LatePredictionRow {
  player_id: string
  race_id: string
  is_late: boolean
  race: { round_number: number } | null
}

/**
 * Count each player's late submissions in rounds before `currentRoundNumber`,
 * which gives the offense number (count + 1) for a late prediction in that round.
 * Returns null if the late predictions cannot be fetched, so callers never score
 * penalties from an incomplete history.
 */
export async function fetchLateSubmissionCounts(
  supabase: SupabaseClient,
  currentRoundNumber: number,
  playerIds: string[]
): Promise<Map<string, number> | null> {
  const { data, error } = await supabase
    .from('race_predictions')
    .select('player_id, race_id, is_late, race:races(round_number)')
    .eq('is_late', true)

  if (error) return null

  const lateSubmissions: LateSubmission[] = ((data ?? []) as unknown as LatePredictionRow[])
    .filter((row) => row.race !== null)
    .map((row) => ({
      player_id: row.player_id,
      race_id: row.race_id,
      is_late: row.is_late,
      round_number: row.race!.round_number,
    }))

  const counts = new Map<string, number>()
  playerIds.forEach((playerId) => {
    counts.set(playerId, countLateSubmissions(playerId, currentRoundNumber, lateSubmissions))
  })
  return counts
}

export async function calculateAndSaveRaceScores(
  raceId: string,
  supabase: SupabaseClient
): Promise<RaceScoreResult> {
  const { data: predictions, error: predictionsError } = await supabase
    .from('race_predictions')
    .select('*')
    .eq('race_id', raceId)

  if (predictionsError) return { raceId, scoresCalculated: 0, penaltiesApplied: 0, error: 'Failed to fetch predictions' }
  if (!predictions || predictions.length === 0) return { raceId, scoresCalculated: 0, penaltiesApplied: 0 }

  const { data: race, error: raceFetchError } = await supabase
    .from('races')
    .select('round_number, status')
    .eq('id', raceId)
    .single()

  if (raceFetchError || !race) return { raceId, scoresCalculated: 0, penaltiesApplied: 0, error: 'Failed to fetch race' }

  const { data: sprintResults, error: sprintError } = await supabase
    .from('race_results')
    .select('*')
    .eq('race_id', raceId)
    .eq('result_type', 'sprint')

  if (sprintError) return { raceId, scoresCalculated: 0, penaltiesApplied: 0, error: 'Failed to fetch sprint results' }
  if (!sprintResults || sprintResults.length === 0) return { raceId, scoresCalculated: 0, penaltiesApplied: 0, error: 'Sprint results not found' }

  const { data: raceResults, error: raceError } = await supabase
    .from('race_results')
    .select('*')
    .eq('race_id', raceId)
    .eq('result_type', 'race')

  if (raceError) return { raceId, scoresCalculated: 0, penaltiesApplied: 0, error: 'Failed to fetch race results' }

  // A completed race with no main race results is a cancelled Grand Prix: score the Sprint
  // alone, with Race and Glorious 7 predictions earning 0 against an empty result set
  if ((!raceResults || raceResults.length === 0) && race.status !== 'completed') {
    return { raceId, scoresCalculated: 0, penaltiesApplied: 0, error: 'Race results not found' }
  }
  const effectiveRaceResults = (raceResults ?? []) as RaceResult[]

  const sprintValidation = validateRaceResults(sprintResults as RaceResult[])
  if (!sprintValidation.valid) return { raceId, scoresCalculated: 0, penaltiesApplied: 0, error: `Invalid sprint results: ${sprintValidation.error}` }

  const raceValidation = validateRaceResults(effectiveRaceResults)
  if (!raceValidation.valid) return { raceId, scoresCalculated: 0, penaltiesApplied: 0, error: `Invalid race results: ${raceValidation.error}` }

  const lateSubmissionCounts = await fetchLateSubmissionCounts(
    supabase,
    race.round_number,
    predictions.map((p) => p.player_id)
  )
  if (!lateSubmissionCounts) return { raceId, scoresCalculated: 0, penaltiesApplied: 0, error: 'Failed to fetch late submissions' }

  const { data: gloriousRidersData } = await supabase
    .from('race_glorious_riders')
    .select('rider_id')
    .eq('race_id', raceId)

  const gloriousRiderIds = gloriousRidersData?.map((r: { rider_id: string }) => r.rider_id) || []

  const scores = calculateAllRaceScores(
    predictions as RacePrediction[],
    sprintResults as RaceResult[],
    effectiveRaceResults,
    lateSubmissionCounts,
    gloriousRiderIds
  )

  const scoresWithoutTotal = scores.map((score) => ({
    player_id: score.player_id,
    race_id: score.race_id,
    sprint_1st_points: score.sprint_1st_points,
    sprint_2nd_points: score.sprint_2nd_points,
    sprint_3rd_points: score.sprint_3rd_points,
    race_1st_points: score.race_1st_points,
    race_2nd_points: score.race_2nd_points,
    race_3rd_points: score.race_3rd_points,
    glorious_7_points: score.glorious_7_points,
    penalty_points: score.penalty_points,
  }))

  const { error: upsertError } = await supabase
    .from('player_scores')
    .upsert(scoresWithoutTotal, { onConflict: 'player_id,race_id' })

  if (upsertError) return { raceId, scoresCalculated: 0, penaltiesApplied: 0, error: 'Failed to store scores' }

  const penaltyRecords = scores
    .filter((score) => score.penalty_points > 0)
    .map((score) => {
      const lateCount = lateSubmissionCounts.get(score.player_id) || 0
      return {
        player_id: score.player_id,
        race_id: score.race_id,
        offense_number: lateCount + 1,
        penalty_points: score.penalty_points,
        reason: 'Late prediction submission',
      }
    })

  await supabase.from('penalties').delete().eq('race_id', raceId)

  if (penaltyRecords.length > 0) {
    await supabase.from('penalties').insert(penaltyRecords)
  }

  return { raceId, scoresCalculated: scores.length, penaltiesApplied: penaltyRecords.length }
}
