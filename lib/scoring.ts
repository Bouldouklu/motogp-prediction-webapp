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
      0: 25, // Exact match
      1: 18, // Off by 1
      2: 15, // Off by 2
      3: 10, // Off by 3
      4: 6,  // Off by 4
      5: 2,  // Off by 5
    };
    return pointsMap[diff] ?? 0; // 6+ positions = 0 points
  }

  if (type === 'glorious7') {
    // For 7th place prediction
    const pointsMap: Record<number, number> = {
      0: 25, // Exact 7th place
      1: 18, // Off by 1
      2: 15, // Off by 2
      3: 10, // Off by 3
      4: 6,  // Off by 4
      5: 2,  // Off by 5
    };
    return pointsMap[diff] ?? 0; // 6+ positions = 0 points
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
  if (predictions.first === results.first) points += 250;
  if (predictions.second === results.second) points += 100;
  if (predictions.third === results.third) points += 100;
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
  // Top 3 Sprint predictions
  sprint_1st_id: string;
  sprint_2nd_id: string;
  sprint_3rd_id: string;
  // Top 3 Race predictions
  race_1st_id: string;
  race_2nd_id: string;
  race_3rd_id: string;
  // Glorious 7 prediction (Mini-League)
  glorious_1st_id: string;
  glorious_2nd_id: string;
  glorious_3rd_id: string;
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
  // Individual position points for sprint top 3
  sprint_1st_points: number;
  sprint_2nd_points: number;
  sprint_3rd_points: number;
  // Individual position points for race top 3
  race_1st_points: number;
  race_2nd_points: number;
  race_3rd_points: number;
  // Glorious 7 and penalties
  glorious_7_points: number;
  penalty_points: number;
}

export interface ScoreBreakdown {
  player_id: string;
  player_name: string;
  race_id: string;
  race_name: string;
  // Sprint top 3 predictions
  sprint_1st_prediction?: string;
  sprint_1st_actual?: string;
  sprint_1st_points: number;
  sprint_2nd_prediction?: string;
  sprint_2nd_actual?: string;
  sprint_2nd_points: number;
  sprint_3rd_prediction?: string;
  sprint_3rd_actual?: string;
  sprint_3rd_points: number;
  // Race top 3 predictions
  race_1st_prediction?: string;
  race_1st_actual?: string;
  race_1st_points: number;
  race_2nd_prediction?: string;
  race_2nd_actual?: string;
  race_2nd_points: number;
  race_3rd_prediction?: string;
  race_3rd_actual?: string;
  race_3rd_points: number;
  // Glorious 7 (Mini-League)
  glorious_1st_prediction?: string;
  glorious_1st_actual?: string;
  glorious_1st_points: number;
  glorious_2nd_prediction?: string;
  glorious_2nd_actual?: string;
  glorious_2nd_points: number;
  glorious_3rd_prediction?: string;
  glorious_3rd_actual?: string;
  glorious_3rd_points: number;
  // Total for glorious category to keep backward compatibility in DB sum if needed,
  // typically we just sum them up into total_points
  glorious_points: number;
  penalty_points: number;
  total_points: number;
  is_late: boolean;
}

/**
 * Calculate score for a single race prediction against race results
 * @param prediction Player's race prediction (top 3 for sprint and race)
 * @param sprintResults Sprint race results (array of positions)
 * @param raceResults Main race results (array of positions)
 * @param gloriousRiderIds IDs of the 7 riders selected for Glorious 7
 * @returns Calculated score breakdown
 */
export function calculateRaceScore(
  prediction: RacePrediction,
  sprintResults: RaceResult[],
  raceResults: RaceResult[],
  lateSubmissionCount: number = 0,
  gloriousRiderIds: string[] = []
): PlayerScore {
  let sprint1stPoints = 0;
  let sprint2ndPoints = 0;
  let sprint3rdPoints = 0;
  let race1stPoints = 0;
  let race2ndPoints = 0;
  let race3rdPoints = 0;
  let gloriousPoints = 0;
  let penaltyPoints = 0;

  // Calculate sprint 1st place prediction points
  const sprint1stPosition = sprintResults.find(
    (r) => r.rider_id === prediction.sprint_1st_id
  )?.position;
  if (sprint1stPosition !== undefined) {
    sprint1stPoints = calculatePositionPoints(sprint1stPosition, 1, 'winner');
  }

  // Calculate sprint 2nd place prediction points
  const sprint2ndPosition = sprintResults.find(
    (r) => r.rider_id === prediction.sprint_2nd_id
  )?.position;
  if (sprint2ndPosition !== undefined) {
    sprint2ndPoints = calculatePositionPoints(sprint2ndPosition, 2, 'winner');
  }

  // Calculate sprint 3rd place prediction points
  const sprint3rdPosition = sprintResults.find(
    (r) => r.rider_id === prediction.sprint_3rd_id
  )?.position;
  if (sprint3rdPosition !== undefined) {
    sprint3rdPoints = calculatePositionPoints(sprint3rdPosition, 3, 'winner');
  }

  // Calculate race 1st place prediction points
  const race1stPosition = raceResults.find(
    (r) => r.rider_id === prediction.race_1st_id
  )?.position;
  if (race1stPosition !== undefined) {
    race1stPoints = calculatePositionPoints(race1stPosition, 1, 'winner');
  }

  // Calculate race 2nd place prediction points
  const race2ndPosition = raceResults.find(
    (r) => r.rider_id === prediction.race_2nd_id
  )?.position;
  if (race2ndPosition !== undefined) {
    race2ndPoints = calculatePositionPoints(race2ndPosition, 2, 'winner');
  }

  // Calculate race 3rd place prediction points
  const race3rdPosition = raceResults.find(
    (r) => r.rider_id === prediction.race_3rd_id
  )?.position;
  if (race3rdPosition !== undefined) {
    race3rdPoints = calculatePositionPoints(race3rdPosition, 3, 'winner');
  }

  // Calculate Glorious 7 Mini-League points
  // 1. Filter race results to only include the 7 selected riders
  const gloriousResults = raceResults
    .filter(r => gloriousRiderIds.includes(r.rider_id))
    .sort((a, b) => a.position - b.position);

  // 2. Determine relative positions (1st, 2nd, 3rd among the 7)
  // We only care about the top 3 of this mini-league

  // Helper to find relative position of a predicted rider
  const getRelativePosition = (riderId: string): number | undefined => {
    const index = gloriousResults.findIndex(r => r.rider_id === riderId);
    return index !== -1 ? index + 1 : undefined; // 1-based relative position
  };

  // Score Glorious 1st
  const g1Pos = getRelativePosition(prediction.glorious_1st_id);
  if (g1Pos !== undefined) {
    gloriousPoints += calculatePositionPoints(g1Pos, 1, 'winner');
  }

  // Score Glorious 2nd
  const g2Pos = getRelativePosition(prediction.glorious_2nd_id);
  if (g2Pos !== undefined) {
    gloriousPoints += calculatePositionPoints(g2Pos, 2, 'winner');
  }

  // Score Glorious 3rd
  const g3Pos = getRelativePosition(prediction.glorious_3rd_id);
  if (g3Pos !== undefined) {
    gloriousPoints += calculatePositionPoints(g3Pos, 3, 'winner');
  }

  // Calculate penalty for late submission
  if (prediction.is_late) {
    penaltyPoints = calculatePenalty(lateSubmissionCount + 1);
  }

  return {
    player_id: prediction.player_id,
    race_id: prediction.race_id,
    sprint_1st_points: sprint1stPoints,
    sprint_2nd_points: sprint2ndPoints,
    sprint_3rd_points: sprint3rdPoints,
    race_1st_points: race1stPoints,
    race_2nd_points: race2ndPoints,
    race_3rd_points: race3rdPoints,
    glorious_7_points: gloriousPoints,
    penalty_points: penaltyPoints,
  };
}

/**
 * Calculate scores for all predictions for a given race
 * @param predictions All player predictions for the race
 * @param sprintResults Sprint race results
 * @param raceResults Main race results
 * @param playerLateSubmissionCounts Map of player_id to their late submission count
 * @param gloriousRiderIds IDs of the 7 riders selected for Glorious 7
 * @returns Array of calculated scores
 */
export function calculateAllRaceScores(
  predictions: RacePrediction[],
  sprintResults: RaceResult[],
  raceResults: RaceResult[],
  playerLateSubmissionCounts: Map<string, number>,
  gloriousRiderIds: string[] = []
): PlayerScore[] {
  return predictions.map((prediction) => {
    const lateCount = playerLateSubmissionCounts.get(prediction.player_id) || 0;
    return calculateRaceScore(prediction, sprintResults, raceResults, lateCount, gloriousRiderIds);
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
