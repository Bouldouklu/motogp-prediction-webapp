/**
 * Test suite for the scoring engine
 * Run with: npm test or your test runner of choice
 */

import {
  calculatePositionPoints,
  calculatePenalty,
  calculateChampionshipPoints,
  calculateRaceScore,
  calculateAllRaceScores,
  validateRaceResults,
  countLateSubmissions,
  getRiderPosition,
  isLateSubmission,
  type RacePrediction,
  type RaceResult,
} from './scoring'

describe('Scoring Engine Tests', () => {
  // ============================================================================
  // POSITION POINTS CALCULATION TESTS
  // ============================================================================

  describe('calculatePositionPoints - Winner predictions', () => {
    test('Exact winner prediction (position 1) should give 12 points', () => {
      expect(calculatePositionPoints(1, 1, 'winner')).toBe(12)
    })

    test('Off by 1 position should give 9 points', () => {
      expect(calculatePositionPoints(2, 1, 'winner')).toBe(9)
    })

    test('Off by 2 positions should give 7 points', () => {
      expect(calculatePositionPoints(3, 1, 'winner')).toBe(7)
    })

    test('Off by 3 positions should give 5 points', () => {
      expect(calculatePositionPoints(4, 1, 'winner')).toBe(5)
    })

    test('Off by 4 positions should give 4 points', () => {
      expect(calculatePositionPoints(5, 1, 'winner')).toBe(4)
    })

    test('Off by 5 positions should give 2 points', () => {
      expect(calculatePositionPoints(6, 1, 'winner')).toBe(2)
    })

    test('Off by 6+ positions should give 0 points', () => {
      expect(calculatePositionPoints(7, 1, 'winner')).toBe(0)
      expect(calculatePositionPoints(10, 1, 'winner')).toBe(0)
      expect(calculatePositionPoints(20, 1, 'winner')).toBe(0)
    })
  })

  describe('calculatePositionPoints - Glorious 7 predictions', () => {
    test('Exact 7th place prediction should give 12 points', () => {
      expect(calculatePositionPoints(7, 7, 'glorious7')).toBe(12)
    })

    test('Off by 1 position should give 9 points', () => {
      expect(calculatePositionPoints(6, 7, 'glorious7')).toBe(9)
      expect(calculatePositionPoints(8, 7, 'glorious7')).toBe(9)
    })

    test('Off by 2 positions should give 7 points', () => {
      expect(calculatePositionPoints(5, 7, 'glorious7')).toBe(7)
      expect(calculatePositionPoints(9, 7, 'glorious7')).toBe(7)
    })

    test('Off by 3 positions should give 5 points', () => {
      expect(calculatePositionPoints(4, 7, 'glorious7')).toBe(5)
      expect(calculatePositionPoints(10, 7, 'glorious7')).toBe(5)
    })

    test('Off by 4 positions should give 4 points', () => {
      expect(calculatePositionPoints(3, 7, 'glorious7')).toBe(4)
      expect(calculatePositionPoints(11, 7, 'glorious7')).toBe(4)
    })

    test('Off by 5+ positions should give 0 points', () => {
      expect(calculatePositionPoints(1, 7, 'glorious7')).toBe(0)
      expect(calculatePositionPoints(2, 7, 'glorious7')).toBe(0)
      expect(calculatePositionPoints(12, 7, 'glorious7')).toBe(0)
      expect(calculatePositionPoints(15, 7, 'glorious7')).toBe(0)
    })
  })

  // ============================================================================
  // PENALTY CALCULATION TESTS
  // ============================================================================

  describe('calculatePenalty', () => {
    test('First late submission should be 10 points penalty', () => {
      expect(calculatePenalty(1)).toBe(10)
    })

    test('Second late submission should be 25 points penalty', () => {
      expect(calculatePenalty(2)).toBe(25)
    })

    test('Third and subsequent late submissions should be 50 points penalty', () => {
      expect(calculatePenalty(3)).toBe(50)
      expect(calculatePenalty(4)).toBe(50)
      expect(calculatePenalty(5)).toBe(50)
      expect(calculatePenalty(10)).toBe(50)
    })
  })

  // ============================================================================
  // CHAMPIONSHIP POINTS TESTS
  // ============================================================================

  describe('calculateChampionshipPoints', () => {
    test('All correct predictions should give 87 points (37+25+25)', () => {
      const predictions = { first: 'rider1', second: 'rider2', third: 'rider3' }
      const results = { first: 'rider1', second: 'rider2', third: 'rider3' }
      expect(calculateChampionshipPoints(predictions, results)).toBe(87)
    })

    test('Only first place correct should give 37 points', () => {
      const predictions = { first: 'rider1', second: 'rider2', third: 'rider3' }
      const results = { first: 'rider1', second: 'rider4', third: 'rider5' }
      expect(calculateChampionshipPoints(predictions, results)).toBe(37)
    })

    test('Only second place correct should give 25 points', () => {
      const predictions = { first: 'rider1', second: 'rider2', third: 'rider3' }
      const results = { first: 'rider4', second: 'rider2', third: 'rider5' }
      expect(calculateChampionshipPoints(predictions, results)).toBe(25)
    })

    test('Only third place correct should give 25 points', () => {
      const predictions = { first: 'rider1', second: 'rider2', third: 'rider3' }
      const results = { first: 'rider4', second: 'rider5', third: 'rider3' }
      expect(calculateChampionshipPoints(predictions, results)).toBe(25)
    })

    test('No correct predictions should give 0 points', () => {
      const predictions = { first: 'rider1', second: 'rider2', third: 'rider3' }
      const results = { first: 'rider4', second: 'rider5', third: 'rider6' }
      expect(calculateChampionshipPoints(predictions, results)).toBe(0)
    })
  })

  // ============================================================================
  // RACE SCORE CALCULATION TESTS
  // ============================================================================

  describe('calculateRaceScore', () => {
    const mockPrediction: RacePrediction = {
      id: 'pred1',
      player_id: 'player1',
      race_id: 'race1',
      sprint_winner_id: 'rider1',
      race_winner_id: 'rider2',
      glorious_7_id: 'rider3',
      submitted_at: '2026-03-01T10:00:00Z',
      is_late: false,
    }

    const mockSprintResults: RaceResult[] = [
      { id: 'sr1', race_id: 'race1', result_type: 'sprint', position: 1, rider_id: 'rider1' },
      { id: 'sr2', race_id: 'race1', result_type: 'sprint', position: 2, rider_id: 'rider4' },
      { id: 'sr3', race_id: 'race1', result_type: 'sprint', position: 3, rider_id: 'rider5' },
    ]

    const mockRaceResults: RaceResult[] = [
      { id: 'rr1', race_id: 'race1', result_type: 'race', position: 1, rider_id: 'rider2' },
      { id: 'rr2', race_id: 'race1', result_type: 'race', position: 2, rider_id: 'rider6' },
      { id: 'rr3', race_id: 'race1', result_type: 'race', position: 7, rider_id: 'rider3' },
    ]

    test('Perfect predictions should give maximum points', () => {
      const score = calculateRaceScore(mockPrediction, mockSprintResults, mockRaceResults, 0)
      expect(score.sprint_points).toBe(12) // Exact winner
      expect(score.race_points).toBe(12) // Exact winner
      expect(score.glorious_7_points).toBe(12) // Exact 7th
      expect(score.penalty_points).toBe(0)
    })

    test('Late submission should apply penalty', () => {
      const latePrediction = { ...mockPrediction, is_late: true }
      const score = calculateRaceScore(latePrediction, mockSprintResults, mockRaceResults, 0)
      expect(score.penalty_points).toBe(10) // First offense
    })

    test('Second late submission should have higher penalty', () => {
      const latePrediction = { ...mockPrediction, is_late: true }
      const score = calculateRaceScore(latePrediction, mockSprintResults, mockRaceResults, 1)
      expect(score.penalty_points).toBe(25) // Second offense
    })

    test('Rider not finishing (DNF) should give 0 points', () => {
      const dnfPrediction = {
        ...mockPrediction,
        sprint_winner_id: 'rider_dnf',
      }
      const score = calculateRaceScore(dnfPrediction, mockSprintResults, mockRaceResults, 0)
      expect(score.sprint_points).toBe(0)
    })
  })

  // ============================================================================
  // VALIDATION TESTS
  // ============================================================================

  describe('validateRaceResults', () => {
    test('Valid results should pass validation', () => {
      const validResults: RaceResult[] = [
        { id: 'r1', race_id: 'race1', result_type: 'race', position: 1, rider_id: 'rider1' },
        { id: 'r2', race_id: 'race1', result_type: 'race', position: 2, rider_id: 'rider2' },
        { id: 'r3', race_id: 'race1', result_type: 'race', position: 3, rider_id: 'rider3' },
      ]
      const validation = validateRaceResults(validResults)
      expect(validation.valid).toBe(true)
      expect(validation.error).toBeUndefined()
    })

    test('Duplicate positions should fail validation', () => {
      const invalidResults: RaceResult[] = [
        { id: 'r1', race_id: 'race1', result_type: 'race', position: 1, rider_id: 'rider1' },
        { id: 'r2', race_id: 'race1', result_type: 'race', position: 1, rider_id: 'rider2' },
      ]
      const validation = validateRaceResults(invalidResults)
      expect(validation.valid).toBe(false)
      expect(validation.error).toContain('Duplicate positions')
    })

    test('Missing positions should fail validation', () => {
      const invalidResults: RaceResult[] = [
        { id: 'r1', race_id: 'race1', result_type: 'race', position: 1, rider_id: 'rider1' },
        { id: 'r2', race_id: 'race1', result_type: 'race', position: 3, rider_id: 'rider2' },
      ]
      const validation = validateRaceResults(invalidResults)
      expect(validation.valid).toBe(false)
      expect(validation.error).toContain('Missing position')
    })
  })

  // ============================================================================
  // UTILITY FUNCTION TESTS
  // ============================================================================

  describe('countLateSubmissions', () => {
    const mockPredictions: RacePrediction[] = [
      {
        id: 'p1',
        player_id: 'player1',
        race_id: 'race1',
        sprint_winner_id: 'r1',
        race_winner_id: 'r2',
        glorious_7_id: 'r3',
        submitted_at: '2026-03-01T10:00:00Z',
        is_late: true,
      },
      {
        id: 'p2',
        player_id: 'player1',
        race_id: 'race2',
        sprint_winner_id: 'r1',
        race_winner_id: 'r2',
        glorious_7_id: 'r3',
        submitted_at: '2026-03-08T10:00:00Z',
        is_late: false,
      },
      {
        id: 'p3',
        player_id: 'player1',
        race_id: 'race3',
        sprint_winner_id: 'r1',
        race_winner_id: 'r2',
        glorious_7_id: 'r3',
        submitted_at: '2026-03-15T10:00:00Z',
        is_late: true,
      },
    ]

    test('Should count previous late submissions', () => {
      expect(countLateSubmissions('player1', 'race4', mockPredictions)).toBe(2)
    })

    test('Should not count the current race', () => {
      expect(countLateSubmissions('player1', 'race3', mockPredictions)).toBe(1)
    })

    test('Should return 0 for player with no late submissions', () => {
      expect(countLateSubmissions('player2', 'race1', mockPredictions)).toBe(0)
    })
  })

  describe('getRiderPosition', () => {
    const mockResults: RaceResult[] = [
      { id: 'r1', race_id: 'race1', result_type: 'race', position: 1, rider_id: 'rider1' },
      { id: 'r2', race_id: 'race1', result_type: 'race', position: 2, rider_id: 'rider2' },
      { id: 'r3', race_id: 'race1', result_type: 'race', position: 7, rider_id: 'rider3' },
    ]

    test('Should return correct position for rider', () => {
      expect(getRiderPosition('rider1', mockResults)).toBe(1)
      expect(getRiderPosition('rider2', mockResults)).toBe(2)
      expect(getRiderPosition('rider3', mockResults)).toBe(7)
    })

    test('Should return null for rider not in results', () => {
      expect(getRiderPosition('rider_dnf', mockResults)).toBeNull()
    })
  })

  describe('isLateSubmission', () => {
    test('Submission after deadline should be late', () => {
      const submitted = new Date('2026-03-01T10:00:00Z')
      const deadline = new Date('2026-03-01T09:00:00Z')
      expect(isLateSubmission(submitted, deadline)).toBe(true)
    })

    test('Submission before deadline should not be late', () => {
      const submitted = new Date('2026-03-01T08:00:00Z')
      const deadline = new Date('2026-03-01T09:00:00Z')
      expect(isLateSubmission(submitted, deadline)).toBe(false)
    })

    test('Submission exactly at deadline should not be late', () => {
      const submitted = new Date('2026-03-01T09:00:00Z')
      const deadline = new Date('2026-03-01T09:00:00Z')
      expect(isLateSubmission(submitted, deadline)).toBe(false)
    })
  })

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('calculateAllRaceScores - Integration', () => {
    test('Should calculate scores for multiple players', () => {
      const predictions: RacePrediction[] = [
        {
          id: 'p1',
          player_id: 'player1',
          race_id: 'race1',
          sprint_winner_id: 'rider1',
          race_winner_id: 'rider1',
          glorious_7_id: 'rider7',
          submitted_at: '2026-03-01T10:00:00Z',
          is_late: false,
        },
        {
          id: 'p2',
          player_id: 'player2',
          race_id: 'race1',
          sprint_winner_id: 'rider2',
          race_winner_id: 'rider1',
          glorious_7_id: 'rider6',
          submitted_at: '2026-03-01T10:00:00Z',
          is_late: false,
        },
      ]

      const sprintResults: RaceResult[] = [
        { id: 's1', race_id: 'race1', result_type: 'sprint', position: 1, rider_id: 'rider1' },
      ]

      const raceResults: RaceResult[] = [
        { id: 'r1', race_id: 'race1', result_type: 'race', position: 1, rider_id: 'rider1' },
        { id: 'r2', race_id: 'race1', result_type: 'race', position: 6, rider_id: 'rider6' },
        { id: 'r3', race_id: 'race1', result_type: 'race', position: 7, rider_id: 'rider7' },
      ]

      const lateCounts = new Map<string, number>()
      const scores = calculateAllRaceScores(predictions, sprintResults, raceResults, lateCounts)

      expect(scores).toHaveLength(2)

      // Player 1: Perfect sprint (12) + Perfect race (12) + Perfect G7 (12) = 36
      expect(scores[0].sprint_points).toBe(12)
      expect(scores[0].race_points).toBe(12)
      expect(scores[0].glorious_7_points).toBe(12)

      // Player 2: Off by 1 sprint (9) + Perfect race (12) + Off by 1 G7 (9) = 30
      expect(scores[1].sprint_points).toBe(9)
      expect(scores[1].race_points).toBe(12)
      expect(scores[1].glorious_7_points).toBe(9)
    })
  })
})
