/**
 * Calculate points for race winner predictions (Sprint & Main Race)
 * @param predictedPosition Position of the predicted rider
 * @param actualPosition Position of the actual winner (should be 1)
 * @param type Type of prediction ('winner' or 'glorious7')
 * @returns Points earned for the prediction
 */
export function calculatePositionPoints(
  predictedPosition: number,
  actualPosition: number,
  type: 'winner' | 'glorious7'
): number {
  const diff = Math.abs(predictedPosition - actualPosition);

  if (type === 'winner') {
    // For Sprint/Race winner predictions
    const pointsMap: Record<number, number> = {
      0: 12, // Exact match
      1: 9,  // Off by 1
      2: 7,  // Off by 2
      3: 5,  // Off by 3
      4: 4,  // Off by 4
      5: 2,  // Off by 5
    };
    return pointsMap[diff] ?? 0; // 6+ positions = 0 points
  }

  if (type === 'glorious7') {
    // For 7th place prediction
    const pointsMap: Record<number, number> = {
      0: 12, // Exact 7th place
      1: 9,  // Off by 1
      2: 7,  // Off by 2
      3: 5,  // Off by 3
      4: 4,  // Off by 4
    };
    return pointsMap[diff] ?? 0; // 5+ positions = 0 points
  }

  return 0;
}

/**
 * Calculate penalty points for late submissions
 * @param offenseNumber Number of late submissions (1st, 2nd, 3rd, etc.)
 * @returns Penalty points to deduct
 */
export function calculatePenalty(offenseNumber: number): number {
  if (offenseNumber === 1) return 10;
  if (offenseNumber === 2) return 25;
  return 50; // 3rd and beyond
}

/**
 * Calculate championship prediction points at end of season
 * @param predictions Player's championship predictions
 * @param results Actual championship results
 * @returns Total points earned for championship predictions
 */
export function calculateChampionshipPoints(
  predictions: { first: string; second: string; third: string },
  results: { first: string; second: string; third: string }
): number {
  let points = 0;
  if (predictions.first === results.first) points += 37;
  if (predictions.second === results.second) points += 25;
  if (predictions.third === results.third) points += 25;
  return points;
}

/**
 * Check if a prediction was submitted after the deadline
 * @param submittedAt Submission timestamp
 * @param deadlineAt FP1 start timestamp (deadline)
 * @returns true if submission was late
 */
export function isLateSubmission(submittedAt: Date, deadlineAt: Date): boolean {
  return submittedAt > deadlineAt;
}

/**
 * Get time remaining until deadline in milliseconds
 * @param deadlineAt FP1 start timestamp (deadline)
 * @returns Milliseconds until deadline (negative if past)
 */
export function getTimeUntilDeadline(deadlineAt: Date): number {
  return deadlineAt.getTime() - Date.now();
}

/**
 * Format time remaining in a human-readable format
 * @param milliseconds Time in milliseconds
 * @returns Formatted string (e.g., "2d 5h 30m")
 */
export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) return 'Deadline passed';

  const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
  const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(' ') || 'Less than 1m';
}

// ============================================================================
// AUTOMATIC SCORE CALCULATION ENGINE
// ============================================================================

/**
 * Type definitions for scoring engine
 */
export interface RacePrediction {
  id: string;
  player_id: string;
  race_id: string;
  sprint_winner_id: string;
  race_winner_id: string;
  glorious_7_id: string;
  submitted_at: string;
  is_late: boolean;
}

export interface RaceResult {
  id: string;
  race_id: string;
  result_type: 'sprint' | 'race';
  position: number;
  rider_id: string;
}

export interface PlayerScore {
  player_id: string;
  race_id: string;
  sprint_points: number;
  race_points: number;
  glorious_7_points: number;
  penalty_points: number;
}

export interface ScoreBreakdown {
  player_id: string;
  player_name: string;
  race_id: string;
  race_name: string;
  sprint_winner_prediction?: string;
  sprint_winner_actual?: string;
  sprint_points: number;
  race_winner_prediction?: string;
  race_winner_actual?: string;
  race_points: number;
  glorious_7_prediction?: string;
  glorious_7_actual?: string;
  glorious_7_points: number;
  penalty_points: number;
  total_points: number;
  is_late: boolean;
}

/**
 * Calculate score for a single race prediction against race results
 * @param prediction Player's race prediction
 * @param sprintResults Sprint race results (array of positions)
 * @param raceResults Main race results (array of positions)
 * @param lateSubmissionCount Number of previous late submissions by this player
 * @returns Calculated score breakdown
 */
export function calculateRaceScore(
  prediction: RacePrediction,
  sprintResults: RaceResult[],
  raceResults: RaceResult[],
  lateSubmissionCount: number = 0
): PlayerScore {
  let sprintPoints = 0;
  let racePoints = 0;
  let glorious7Points = 0;
  let penaltyPoints = 0;

  // Calculate sprint winner points
  const sprintWinnerPosition = sprintResults.find(
    (r) => r.rider_id === prediction.sprint_winner_id
  )?.position;

  if (sprintWinnerPosition !== undefined) {
    sprintPoints = calculatePositionPoints(sprintWinnerPosition, 1, 'winner');
  }

  // Calculate race winner points
  const raceWinnerPosition = raceResults.find(
    (r) => r.rider_id === prediction.race_winner_id
  )?.position;

  if (raceWinnerPosition !== undefined) {
    racePoints = calculatePositionPoints(raceWinnerPosition, 1, 'winner');
  }

  // Calculate glorious 7 points
  const glorious7Position = raceResults.find(
    (r) => r.rider_id === prediction.glorious_7_id
  )?.position;

  if (glorious7Position !== undefined) {
    glorious7Points = calculatePositionPoints(glorious7Position, 7, 'glorious7');
  }

  // Calculate penalty for late submission
  if (prediction.is_late) {
    penaltyPoints = calculatePenalty(lateSubmissionCount + 1);
  }

  return {
    player_id: prediction.player_id,
    race_id: prediction.race_id,
    sprint_points: sprintPoints,
    race_points: racePoints,
    glorious_7_points: glorious7Points,
    penalty_points: penaltyPoints,
  };
}

/**
 * Calculate scores for all predictions for a given race
 * @param predictions All player predictions for the race
 * @param sprintResults Sprint race results
 * @param raceResults Main race results
 * @param playerLateSubmissionCounts Map of player_id to their late submission count
 * @returns Array of calculated scores
 */
export function calculateAllRaceScores(
  predictions: RacePrediction[],
  sprintResults: RaceResult[],
  raceResults: RaceResult[],
  playerLateSubmissionCounts: Map<string, number>
): PlayerScore[] {
  return predictions.map((prediction) => {
    const lateCount = playerLateSubmissionCounts.get(prediction.player_id) || 0;
    return calculateRaceScore(prediction, sprintResults, raceResults, lateCount);
  });
}

/**
 * Get the position where a rider finished in the race
 * @param riderId The rider's UUID
 * @param results Array of race results
 * @returns Position number or null if rider didn't finish/wasn't found
 */
export function getRiderPosition(riderId: string, results: RaceResult[]): number | null {
  const result = results.find((r) => r.rider_id === riderId);
  return result ? result.position : null;
}

/**
 * Validate that race results are complete and valid
 * @param results Race results array
 * @returns Validation result with error message if invalid
 */
export function validateRaceResults(
  results: RaceResult[]
): { valid: boolean; error?: string } {
  // Check for duplicate positions
  const positions = results.map((r) => r.position);
  const uniquePositions = new Set(positions);
  if (positions.length !== uniquePositions.size) {
    return { valid: false, error: 'Duplicate positions found in results' };
  }

  // Check for missing positions (should have 1, 2, 3, ... n)
  const sortedPositions = [...positions].sort((a, b) => a - b);
  for (let i = 0; i < sortedPositions.length; i++) {
    if (sortedPositions[i] !== i + 1) {
      return { valid: false, error: `Missing position ${i + 1} in results` };
    }
  }

  return { valid: true };
}

/**
 * Count late submissions for a player up to a specific race
 * @param playerId Player's UUID
 * @param raceId Current race UUID (to count up to but not including this race)
 * @param allPredictions All predictions to scan through
 * @returns Number of late submissions
 */
export function countLateSubmissions(
  playerId: string,
  raceId: string,
  allPredictions: RacePrediction[]
): number {
  return allPredictions.filter(
    (p) => p.player_id === playerId && p.race_id !== raceId && p.is_late
  ).length;
}
