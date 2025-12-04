import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRiderPosition, type ScoreBreakdown } from '@/lib/scoring';

/**
 * GET /api/scores/breakdown?raceId=xxx&playerId=xxx
 * Get detailed score breakdown for a player's race predictions
 *
 * Query parameters:
 * - raceId (required): UUID of the race
 * - playerId (optional): UUID of specific player, or omit for all players
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const raceId = searchParams.get('raceId');
    const playerId = searchParams.get('playerId');

    if (!raceId) {
      return NextResponse.json(
        { error: 'raceId query parameter is required' },
        { status: 400 }
      );
    }

    // Build query for predictions
    let predictionQuery = supabase
      .from('race_predictions')
      .select(`
        *,
        player:players(name),
        sprint_winner:riders!race_predictions_sprint_winner_id_fkey(name, number),
        race_winner:riders!race_predictions_race_winner_id_fkey(name, number),
        glorious_7:riders!race_predictions_glorious_7_id_fkey(name, number)
      `)
      .eq('race_id', raceId);

    if (playerId) {
      predictionQuery = predictionQuery.eq('player_id', playerId);
    }

    const { data: predictions, error: predError } = await predictionQuery;

    if (predError) {
      console.error('Error fetching predictions:', predError);
      return NextResponse.json(
        { error: 'Failed to fetch predictions' },
        { status: 500 }
      );
    }

    if (!predictions || predictions.length === 0) {
      return NextResponse.json(
        { error: 'No predictions found' },
        { status: 404 }
      );
    }

    // Fetch race info
    const { data: race, error: raceError } = await supabase
      .from('races')
      .select('name, round_number')
      .eq('id', raceId)
      .single();

    if (raceError) {
      console.error('Error fetching race:', raceError);
      return NextResponse.json(
        { error: 'Failed to fetch race information' },
        { status: 500 }
      );
    }

    // Fetch results
    const { data: sprintResults } = await supabase
      .from('race_results')
      .select(`
        *,
        rider:riders(name, number)
      `)
      .eq('race_id', raceId)
      .eq('result_type', 'sprint')
      .order('position');

    const { data: raceResults } = await supabase
      .from('race_results')
      .select(`
        *,
        rider:riders(name, number)
      `)
      .eq('race_id', raceId)
      .eq('result_type', 'race')
      .order('position');

    // Fetch scores
    let scoresQuery = supabase
      .from('player_scores')
      .select('*')
      .eq('race_id', raceId);

    if (playerId) {
      scoresQuery = scoresQuery.eq('player_id', playerId);
    }

    const { data: scores, error: scoresError } = await scoresQuery;

    if (scoresError) {
      console.error('Error fetching scores:', scoresError);
      return NextResponse.json(
        { error: 'Failed to fetch scores' },
        { status: 500 }
      );
    }

    // Build breakdown for each prediction
    const breakdowns: ScoreBreakdown[] = predictions.map((prediction: any) => {
      const playerScore = scores?.find((s) => s.player_id === prediction.player_id);

      // Find what position the predicted riders finished
      const sprintWinnerPos = sprintResults?.find(
        (r: any) => r.rider_id === prediction.sprint_winner_id
      );
      const raceWinnerPos = raceResults?.find(
        (r: any) => r.rider_id === prediction.race_winner_id
      );
      const glorious7Pos = raceResults?.find(
        (r: any) => r.rider_id === prediction.glorious_7_id
      );

      // Find actual winners
      const actualSprintWinner = sprintResults?.find((r: any) => r.position === 1);
      const actualRaceWinner = raceResults?.find((r: any) => r.position === 1);
      const actualGlorious7 = raceResults?.find((r: any) => r.position === 7);

      return {
        player_id: prediction.player_id,
        player_name: prediction.player?.name || 'Unknown',
        race_id: raceId,
        race_name: race?.name || 'Unknown Race',

        // Sprint predictions
        sprint_winner_prediction: prediction.sprint_winner?.name
          ? `${prediction.sprint_winner.name} (#${prediction.sprint_winner.number})${
              sprintWinnerPos ? ` - Finished P${sprintWinnerPos.position}` : ' - DNF'
            }`
          : undefined,
        sprint_winner_actual: actualSprintWinner?.rider?.name
          ? `${actualSprintWinner.rider.name} (#${actualSprintWinner.rider.number})`
          : undefined,
        sprint_points: playerScore?.sprint_points || 0,

        // Race winner predictions
        race_winner_prediction: prediction.race_winner?.name
          ? `${prediction.race_winner.name} (#${prediction.race_winner.number})${
              raceWinnerPos ? ` - Finished P${raceWinnerPos.position}` : ' - DNF'
            }`
          : undefined,
        race_winner_actual: actualRaceWinner?.rider?.name
          ? `${actualRaceWinner.rider.name} (#${actualRaceWinner.rider.number})`
          : undefined,
        race_points: playerScore?.race_points || 0,

        // Glorious 7 predictions
        glorious_7_prediction: prediction.glorious_7?.name
          ? `${prediction.glorious_7.name} (#${prediction.glorious_7.number})${
              glorious7Pos ? ` - Finished P${glorious7Pos.position}` : ' - DNF'
            }`
          : undefined,
        glorious_7_actual: actualGlorious7?.rider?.name
          ? `${actualGlorious7.rider.name} (#${actualGlorious7.rider.number})`
          : undefined,
        glorious_7_points: playerScore?.glorious_7_points || 0,

        // Penalties and totals
        penalty_points: playerScore?.penalty_points || 0,
        total_points: playerScore?.total_points || 0,
        is_late: prediction.is_late || false,
      };
    });

    return NextResponse.json({
      race: {
        id: raceId,
        name: race?.name,
        round_number: race?.round_number,
      },
      breakdowns,
    });
  } catch (error) {
    console.error('Error in score breakdown:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
