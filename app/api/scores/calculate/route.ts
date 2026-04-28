import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  calculateAllRaceScores,
  validateRaceResults,
  countLateSubmissions,
  type RacePrediction,
  type RaceResult,
} from '@/lib/scoring';
import { calculateAndSaveRaceScores } from '@/lib/score-runner';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { raceId } = await request.json();

    if (!raceId) {
      return NextResponse.json({ error: 'raceId is required' }, { status: 400 });
    }

    const result = await calculateAndSaveRaceScores(raceId, supabase);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      scoresCalculated: result.scoresCalculated,
      penaltiesApplied: result.penaltiesApplied,
    });
  } catch (error) {
    console.error('Unexpected error in score calculation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
