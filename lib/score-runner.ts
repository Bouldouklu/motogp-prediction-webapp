import {
  calculateAllRaceScores,
  validateRaceResults,
  countLateSubmissions,
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
  if (!raceResults || raceResults.length === 0) return { raceId, scoresCalculated: 0, penaltiesApplied: 0, error: 'Race results not found' }

  const sprintValidation = validateRaceResults(sprintResults as RaceResult[])
  if (!sprintValidation.valid) return { raceId, scoresCalculated: 0, penaltiesApplied: 0, error: `Invalid sprint results: ${sprintValidation.error}` }

  const raceValidation = validateRaceResults(raceResults as RaceResult[])
  if (!raceValidation.valid) return { raceId, scoresCalculated: 0, penaltiesApplied: 0, error: `Invalid race results: ${raceValidation.error}` }

  const { data: allLatePredictions } = await supabase
    .from('race_predictions')
    .select('player_id, race_id, is_late')
    .eq('is_late', true)

  const lateSubmissionCounts = new Map<string, number>()
  predictions.forEach((prediction) => {
    const count = countLateSubmissions(
      prediction.player_id,
      raceId,
      (allLatePredictions || []) as RacePrediction[]
    )
    lateSubmissionCounts.set(prediction.player_id, count)
  })

  const { data: gloriousRidersData } = await supabase
    .from('race_glorious_riders')
    .select('rider_id')
    .eq('race_id', raceId)

  const gloriousRiderIds = gloriousRidersData?.map((r: { rider_id: string }) => r.rider_id) || []

  const scores = calculateAllRaceScores(
    predictions as RacePrediction[],
    sprintResults as RaceResult[],
    raceResults as RaceResult[],
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
