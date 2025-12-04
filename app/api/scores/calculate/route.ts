import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  calculateRaceScore,
  calculateAllRaceScores,
  validateRaceResults,
  countLateSubmissions,
  type RacePrediction,
  type RaceResult,
  type PlayerScore,
} from '@/lib/scoring';

/**
 * POST /api/scores/calculate
 * Calculate and store scores for a specific race
 *
 * Request body:
 * {
 *   raceId: string;  // UUID of the race to calculate scores for
 * }
 *
 * This endpoint:
 * 1. Fetches all predictions for the race
 * 2. Fetches sprint and race results
 * 3. Validates results are complete
 * 4. Calculates scores for each player
 * 5. Stores/updates scores in player_scores table
 * 6. Creates penalty records if needed
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { raceId } = await request.json();

    if (!raceId) {
      return NextResponse.json(
        { error: 'raceId is required' },
        { status: 400 }
      );
    }

    // Fetch all predictions for this race
    const { data: predictions, error: predictionsError } = await supabase
      .from('race_predictions')
      .select('*')
      .eq('race_id', raceId);

    if (predictionsError) {
      console.error('Error fetching predictions:', predictionsError);
      return NextResponse.json(
        { error: 'Failed to fetch predictions' },
        { status: 500 }
      );
    }

    if (!predictions || predictions.length === 0) {
      return NextResponse.json(
        { message: 'No predictions found for this race', scoresCalculated: 0 },
        { status: 200 }
      );
    }

    // Fetch sprint results
    const { data: sprintResults, error: sprintError } = await supabase
      .from('race_results')
      .select('*')
      .eq('race_id', raceId)
      .eq('result_type', 'sprint');

    if (sprintError) {
      console.error('Error fetching sprint results:', sprintError);
      return NextResponse.json(
        { error: 'Failed to fetch sprint results' },
        { status: 500 }
      );
    }

    // Fetch race results
    const { data: raceResults, error: raceError } = await supabase
      .from('race_results')
      .select('*')
      .eq('race_id', raceId)
      .eq('result_type', 'race');

    if (raceError) {
      console.error('Error fetching race results:', raceError);
      return NextResponse.json(
        { error: 'Failed to fetch race results' },
        { status: 500 }
      );
    }

    // Validate results
    if (!sprintResults || sprintResults.length === 0) {
      return NextResponse.json(
        { error: 'Sprint results not found for this race' },
        { status: 400 }
      );
    }

    if (!raceResults || raceResults.length === 0) {
      return NextResponse.json(
        { error: 'Race results not found for this race' },
        { status: 400 }
      );
    }

    const sprintValidation = validateRaceResults(sprintResults as RaceResult[]);
    if (!sprintValidation.valid) {
      return NextResponse.json(
        { error: `Invalid sprint results: ${sprintValidation.error}` },
        { status: 400 }
      );
    }

    const raceValidation = validateRaceResults(raceResults as RaceResult[]);
    if (!raceValidation.valid) {
      return NextResponse.json(
        { error: `Invalid race results: ${raceValidation.error}` },
        { status: 400 }
      );
    }

    // Fetch all predictions to count late submissions per player
    const { data: allPredictions, error: allPredictionsError } = await supabase
      .from('race_predictions')
      .select('player_id, race_id, is_late')
      .eq('is_late', true);

    if (allPredictionsError) {
      console.error('Error fetching all predictions:', allPredictionsError);
      return NextResponse.json(
        { error: 'Failed to fetch prediction history' },
        { status: 500 }
      );
    }

    // Build map of late submission counts
    const lateSubmissionCounts = new Map<string, number>();
    predictions.forEach((prediction) => {
      const count = countLateSubmissions(
        prediction.player_id,
        raceId,
        allPredictions as RacePrediction[]
      );
      lateSubmissionCounts.set(prediction.player_id, count);
    });

    // Calculate scores for all predictions
    const scores = calculateAllRaceScores(
      predictions as RacePrediction[],
      sprintResults as RaceResult[],
      raceResults as RaceResult[],
      lateSubmissionCounts
    );

    // Store scores in database (upsert to handle recalculation)
    const scoresWithoutTotal = scores.map((score) => ({
      player_id: score.player_id,
      race_id: score.race_id,
      sprint_points: score.sprint_points,
      race_points: score.race_points,
      glorious_7_points: score.glorious_7_points,
      penalty_points: score.penalty_points,
    }));

    const { error: upsertError } = await supabase
      .from('player_scores')
      .upsert(scoresWithoutTotal, { onConflict: 'player_id,race_id' });

    if (upsertError) {
      console.error('Error storing scores:', upsertError);
      return NextResponse.json(
        { error: 'Failed to store scores' },
        { status: 500 }
      );
    }

    // Create penalty records for late submissions
    const penaltyRecords = scores
      .filter((score) => score.penalty_points > 0)
      .map((score) => {
        const prediction = predictions.find((p) => p.player_id === score.player_id);
        const lateCount = lateSubmissionCounts.get(score.player_id) || 0;
        return {
          player_id: score.player_id,
          race_id: score.race_id,
          offense_number: lateCount + 1,
          penalty_points: score.penalty_points,
          reason: 'Late prediction submission',
        };
      });

    if (penaltyRecords.length > 0) {
      const { error: penaltyError } = await supabase
        .from('penalties')
        .insert(penaltyRecords);

      if (penaltyError) {
        console.error('Error storing penalties:', penaltyError);
        // Don't fail the entire operation if penalty logging fails
      }
    }

    return NextResponse.json({
      success: true,
      scoresCalculated: scores.length,
      penaltiesApplied: penaltyRecords.length,
      scores: scores,
    });
  } catch (error) {
    console.error('Unexpected error in score calculation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scores/calculate?raceId=xxx
 * Preview score calculation without storing
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const raceId = searchParams.get('raceId');

    if (!raceId) {
      return NextResponse.json(
        { error: 'raceId query parameter is required' },
        { status: 400 }
      );
    }

    // Fetch predictions
    const { data: predictions, error: predictionsError } = await supabase
      .from('race_predictions')
      .select('*')
      .eq('race_id', raceId);

    if (predictionsError || !predictions || predictions.length === 0) {
      return NextResponse.json(
        { error: 'No predictions found for this race' },
        { status: 404 }
      );
    }

    // Fetch results
    const { data: sprintResults } = await supabase
      .from('race_results')
      .select('*')
      .eq('race_id', raceId)
      .eq('result_type', 'sprint');

    const { data: raceResults } = await supabase
      .from('race_results')
      .select('*')
      .eq('race_id', raceId)
      .eq('result_type', 'race');

    if (!sprintResults || !raceResults) {
      return NextResponse.json(
        { error: 'Race results not found' },
        { status: 404 }
      );
    }

    // Fetch late submission counts
    const { data: allPredictions } = await supabase
      .from('race_predictions')
      .select('player_id, race_id, is_late')
      .eq('is_late', true);

    const lateSubmissionCounts = new Map<string, number>();
    predictions.forEach((prediction) => {
      const count = countLateSubmissions(
        prediction.player_id,
        raceId,
        (allPredictions || []) as RacePrediction[]
      );
      lateSubmissionCounts.set(prediction.player_id, count);
    });

    // Calculate scores (preview only)
    const scores = calculateAllRaceScores(
      predictions as RacePrediction[],
      sprintResults as RaceResult[],
      raceResults as RaceResult[],
      lateSubmissionCounts
    );

    return NextResponse.json({
      preview: true,
      scores: scores,
    });
  } catch (error) {
    console.error('Error in score preview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
