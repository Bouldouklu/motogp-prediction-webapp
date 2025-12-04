import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/scores/history?playerId=xxx
 * Get historical scores for a player across all races
 *
 * Query parameters:
 * - playerId (required): UUID of the player
 * - season (optional): Filter by season year (defaults to 2026)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    const season = searchParams.get('season') || '2026';

    if (!playerId) {
      return NextResponse.json(
        { error: 'playerId query parameter is required' },
        { status: 400 }
      );
    }

    // Fetch player info
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('name')
      .eq('id', playerId)
      .single();

    if (playerError || !player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Fetch all races for the season (ordered by round)
    const { data: races, error: racesError } = await supabase
      .from('races')
      .select('*')
      .order('round_number');

    if (racesError) {
      console.error('Error fetching races:', racesError);
      return NextResponse.json(
        { error: 'Failed to fetch races' },
        { status: 500 }
      );
    }

    // Fetch all scores for this player
    const { data: scores, error: scoresError } = await supabase
      .from('player_scores')
      .select(`
        *,
        race:races(name, round_number, race_date, status)
      `)
      .eq('player_id', playerId)
      .order('race.round_number');

    if (scoresError) {
      console.error('Error fetching scores:', scoresError);
      return NextResponse.json(
        { error: 'Failed to fetch scores' },
        { status: 500 }
      );
    }

    // Fetch all predictions for this player
    const { data: predictions, error: predictionsError } = await supabase
      .from('race_predictions')
      .select('race_id, submitted_at, is_late')
      .eq('player_id', playerId);

    if (predictionsError) {
      console.error('Error fetching predictions:', predictionsError);
      return NextResponse.json(
        { error: 'Failed to fetch predictions' },
        { status: 500 }
      );
    }

    // Fetch penalties
    const { data: penalties, error: penaltiesError } = await supabase
      .from('penalties')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at');

    if (penaltiesError) {
      console.error('Error fetching penalties:', penaltiesError);
    }

    // Build history with race-by-race breakdown
    const history = races?.map((race: any) => {
      const score = scores?.find((s: any) => s.race_id === race.id);
      const prediction = predictions?.find((p) => p.race_id === race.id);
      const racePenalties = penalties?.filter((pen: any) => pen.race_id === race.id) || [];

      return {
        race_id: race.id,
        round_number: race.round_number,
        race_name: race.name,
        race_date: race.race_date,
        status: race.status,

        // Prediction status
        has_prediction: !!prediction,
        prediction_submitted_at: prediction?.submitted_at,
        is_late: prediction?.is_late || false,

        // Scores (null if race not yet completed or no prediction)
        sprint_points: score?.sprint_points ?? null,
        race_points: score?.race_points ?? null,
        glorious_7_points: score?.glorious_7_points ?? null,
        penalty_points: score?.penalty_points ?? null,
        total_points: score?.total_points ?? null,

        // Penalty details
        penalties: racePenalties.map((pen: any) => ({
          offense_number: pen.offense_number,
          penalty_points: pen.penalty_points,
          reason: pen.reason,
        })),
      };
    }) || [];

    // Calculate running totals
    let runningTotal = 0;
    const historyWithRunningTotal = history.map((entry) => {
      if (entry.total_points !== null) {
        runningTotal += entry.total_points;
      }
      return {
        ...entry,
        running_total: entry.total_points !== null ? runningTotal : null,
      };
    });

    // Calculate summary statistics
    const completedRaces = history.filter((h) => h.total_points !== null);
    const totalPoints = completedRaces.reduce((sum, h) => sum + (h.total_points || 0), 0);
    const avgPointsPerRace = completedRaces.length > 0
      ? totalPoints / completedRaces.length
      : 0;
    const totalPenalties = penalties?.length || 0;
    const totalPenaltyPoints = penalties?.reduce((sum: number, p: any) => sum + p.penalty_points, 0) || 0;
    const lateSubmissions = predictions?.filter((p) => p.is_late).length || 0;

    return NextResponse.json({
      player: {
        id: playerId,
        name: player.name,
      },
      season: parseInt(season),
      summary: {
        total_races: races?.length || 0,
        races_completed: completedRaces.length,
        races_predicted: predictions?.length || 0,
        total_points: totalPoints,
        average_points_per_race: Math.round(avgPointsPerRace * 100) / 100,
        late_submissions: lateSubmissions,
        total_penalties: totalPenalties,
        total_penalty_points: totalPenaltyPoints,
      },
      history: historyWithRunningTotal,
    });
  } catch (error) {
    console.error('Error in score history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scores/history/all
 * Get historical scores for all players (leaderboard progression)
 */
export async function GET_ALL(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Fetch all players
    const { data: players, error: playersError } = await supabase
      .from('players')
      .select('id, name')
      .order('name');

    if (playersError) {
      return NextResponse.json(
        { error: 'Failed to fetch players' },
        { status: 500 }
      );
    }

    // Fetch all races
    const { data: races, error: racesError } = await supabase
      .from('races')
      .select('*')
      .order('round_number');

    if (racesError) {
      return NextResponse.json(
        { error: 'Failed to fetch races' },
        { status: 500 }
      );
    }

    // Fetch all scores
    const { data: allScores, error: scoresError } = await supabase
      .from('player_scores')
      .select('*');

    if (scoresError) {
      return NextResponse.json(
        { error: 'Failed to fetch scores' },
        { status: 500 }
      );
    }

    // Build progression data
    const progression = players?.map((player: any) => {
      const playerScores = allScores?.filter((s: any) => s.player_id === player.id) || [];

      let runningTotal = 0;
      const raceByRace = races?.map((race: any) => {
        const score = playerScores.find((s: any) => s.race_id === race.id);
        if (score) {
          runningTotal += score.total_points || 0;
        }
        return {
          race_id: race.id,
          round_number: race.round_number,
          race_name: race.name,
          points: score?.total_points || null,
          running_total: score ? runningTotal : null,
        };
      }) || [];

      return {
        player_id: player.id,
        player_name: player.name,
        final_total: runningTotal,
        progression: raceByRace,
      };
    }) || [];

    // Sort by final total (descending)
    progression.sort((a, b) => b.final_total - a.final_total);

    return NextResponse.json({
      season: 2026,
      total_races: races?.length || 0,
      players: progression,
    });
  } catch (error) {
    console.error('Error in all scores history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
