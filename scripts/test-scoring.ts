/**
 * Manual test script for scoring engine
 * Run with: npx ts-node scripts/test-scoring.ts
 */

import {
  calculatePositionPoints,
  calculatePenalty,
  calculateChampionshipPoints,
  calculateRaceScore,
  validateRaceResults,
  type RacePrediction,
  type RaceResult,
} from '../lib/scoring.js'

console.log('🏁 MotoGP Scoring Engine Test Suite\n')

// ============================================================================
// Test 1: Winner Position Points
// ============================================================================
console.log('📊 Test 1: Winner Position Points Calculation')
console.log('---------------------------------------------')
const winnerTests = [
  { pos: 1, expected: 12, desc: 'Exact winner' },
  { pos: 2, expected: 9, desc: 'Off by 1' },
  { pos: 3, expected: 7, desc: 'Off by 2' },
  { pos: 4, expected: 5, desc: 'Off by 3' },
  { pos: 5, expected: 4, desc: 'Off by 4' },
  { pos: 6, expected: 2, desc: 'Off by 5' },
  { pos: 7, expected: 0, desc: 'Off by 6+' },
]

let passed = 0
let failed = 0

winnerTests.forEach((test) => {
  const result = calculatePositionPoints(test.pos, 1, 'winner')
  if (result === test.expected) {
    console.log(`✅ ${test.desc}: ${result} points`)
    passed++
  } else {
    console.log(`❌ ${test.desc}: Expected ${test.expected}, got ${result}`)
    failed++
  }
})
console.log()

// ============================================================================
// Test 2: Glorious 7 Position Points
// ============================================================================
console.log('📊 Test 2: Glorious 7 Position Points Calculation')
console.log('--------------------------------------------------')
const glorious7Tests = [
  { pos: 7, expected: 12, desc: 'Exact 7th place' },
  { pos: 6, expected: 9, desc: 'Off by 1 (6th)' },
  { pos: 8, expected: 9, desc: 'Off by 1 (8th)' },
  { pos: 5, expected: 7, desc: 'Off by 2 (5th)' },
  { pos: 9, expected: 7, desc: 'Off by 2 (9th)' },
  { pos: 4, expected: 5, desc: 'Off by 3 (4th)' },
  { pos: 10, expected: 5, desc: 'Off by 3 (10th)' },
  { pos: 3, expected: 4, desc: 'Off by 4 (3rd)' },
  { pos: 11, expected: 4, desc: 'Off by 4 (11th)' },
  { pos: 1, expected: 0, desc: 'Off by 6 (1st)' },
  { pos: 15, expected: 0, desc: 'Off by 8 (15th)' },
]

glorious7Tests.forEach((test) => {
  const result = calculatePositionPoints(test.pos, 7, 'glorious7')
  if (result === test.expected) {
    console.log(`✅ ${test.desc}: ${result} points`)
    passed++
  } else {
    console.log(`❌ ${test.desc}: Expected ${test.expected}, got ${result}`)
    failed++
  }
})
console.log()

// ============================================================================
// Test 3: Penalty Calculations
// ============================================================================
console.log('📊 Test 3: Late Submission Penalty Calculation')
console.log('-----------------------------------------------')
const penaltyTests = [
  { offense: 1, expected: 10, desc: '1st late submission' },
  { offense: 2, expected: 25, desc: '2nd late submission' },
  { offense: 3, expected: 50, desc: '3rd late submission' },
  { offense: 5, expected: 50, desc: '5th late submission' },
]

penaltyTests.forEach((test) => {
  const result = calculatePenalty(test.offense)
  if (result === test.expected) {
    console.log(`✅ ${test.desc}: -${result} points`)
    passed++
  } else {
    console.log(`❌ ${test.desc}: Expected -${test.expected}, got -${result}`)
    failed++
  }
})
console.log()

// ============================================================================
// Test 4: Championship Points
// ============================================================================
console.log('📊 Test 4: Championship Prediction Points')
console.log('------------------------------------------')

const champTests = [
  {
    predictions: { first: 'rider1', second: 'rider2', third: 'rider3' },
    results: { first: 'rider1', second: 'rider2', third: 'rider3' },
    expected: 87,
    desc: 'All correct (37+25+25)',
  },
  {
    predictions: { first: 'rider1', second: 'rider2', third: 'rider3' },
    results: { first: 'rider1', second: 'rider4', third: 'rider5' },
    expected: 37,
    desc: 'Only 1st correct',
  },
  {
    predictions: { first: 'rider1', second: 'rider2', third: 'rider3' },
    results: { first: 'rider4', second: 'rider2', third: 'rider5' },
    expected: 25,
    desc: 'Only 2nd correct',
  },
  {
    predictions: { first: 'rider1', second: 'rider2', third: 'rider3' },
    results: { first: 'rider4', second: 'rider5', third: 'rider3' },
    expected: 25,
    desc: 'Only 3rd correct',
  },
  {
    predictions: { first: 'rider1', second: 'rider2', third: 'rider3' },
    results: { first: 'rider4', second: 'rider5', third: 'rider6' },
    expected: 0,
    desc: 'All incorrect',
  },
]

champTests.forEach((test) => {
  const result = calculateChampionshipPoints(test.predictions, test.results)
  if (result === test.expected) {
    console.log(`✅ ${test.desc}: ${result} points`)
    passed++
  } else {
    console.log(`❌ ${test.desc}: Expected ${test.expected}, got ${result}`)
    failed++
  }
})
console.log()

// ============================================================================
// Test 5: Full Race Score Calculation
// ============================================================================
console.log('📊 Test 5: Complete Race Score Calculation')
console.log('--------------------------------------------')

const mockPrediction: RacePrediction = {
  id: 'pred1',
  player_id: 'player1',
  race_id: 'race1',
  // Top 3 Sprint predictions
  sprint_1st_id: 'rider1',
  sprint_2nd_id: 'rider4',
  sprint_3rd_id: 'rider5',
  // Top 3 Race predictions
  race_1st_id: 'rider2',
  race_2nd_id: 'rider3',
  race_3rd_id: 'rider6',
  // Glorious 7
  // Glorious 7
  glorious_1st_id: 'rider7',
  glorious_2nd_id: 'rider8',
  glorious_3rd_id: 'rider9',
  submitted_at: '2026-03-01T10:00:00Z',
  is_late: false,
}

const sprintResults: RaceResult[] = [
  { id: 'sr1', race_id: 'race1', result_type: 'sprint', position: 1, rider_id: 'rider1' },
  { id: 'sr2', race_id: 'race1', result_type: 'sprint', position: 2, rider_id: 'rider4' },
  { id: 'sr3', race_id: 'race1', result_type: 'sprint', position: 3, rider_id: 'rider5' },
]

const raceResults: RaceResult[] = [
  { id: 'rr1', race_id: 'race1', result_type: 'race', position: 1, rider_id: 'rider2' },
  { id: 'rr2', race_id: 'race1', result_type: 'race', position: 2, rider_id: 'rider3' },
  { id: 'rr3', race_id: 'race1', result_type: 'race', position: 3, rider_id: 'rider6' },
  { id: 'rr4', race_id: 'race1', result_type: 'race', position: 7, rider_id: 'rider7' }, // relative 1st in glorious group?
  { id: 'rr5', race_id: 'race1', result_type: 'race', position: 8, rider_id: 'rider8' }, // relative 2nd
  { id: 'rr6', race_id: 'race1', result_type: 'race', position: 9, rider_id: 'rider9' }, // relative 3rd
  // and other riders...
]

const gloriousRiderIds = ['rider7', 'rider8', 'rider9', 'rider10', 'rider11', 'rider12', 'rider13'];

const score = calculateRaceScore(mockPrediction, sprintResults, raceResults, 0, gloriousRiderIds)

// Test sprint top 3 predictions
console.log(`Sprint 1st prediction: ${score.sprint_1st_points === 12 ? '✅' : '❌'} ${score.sprint_1st_points} points (expected 12)`)
console.log(`Sprint 2nd prediction: ${score.sprint_2nd_points === 12 ? '✅' : '❌'} ${score.sprint_2nd_points} points (expected 12)`)
console.log(`Sprint 3rd prediction: ${score.sprint_3rd_points === 12 ? '✅' : '❌'} ${score.sprint_3rd_points} points (expected 12)`)
// Test race top 3 predictions
console.log(`Race 1st prediction: ${score.race_1st_points === 12 ? '✅' : '❌'} ${score.race_1st_points} points (expected 12)`)
console.log(`Race 2nd prediction: ${score.race_2nd_points === 12 ? '✅' : '❌'} ${score.race_2nd_points} points (expected 12)`)
console.log(`Race 3rd prediction: ${score.race_3rd_points === 12 ? '✅' : '❌'} ${score.race_3rd_points} points (expected 12)`)
// Test glorious 7 and penalty
console.log(`Glorious 7 points (Total): ${score.glorious_7_points === 36 ? '✅' : '❌'} ${score.glorious_7_points} points (expected 36)`)
console.log(`Penalty: ${score.penalty_points === 0 ? '✅' : '❌'} ${score.penalty_points} points (expected 0)`)

if (
  score.sprint_1st_points === 12 &&
  score.sprint_2nd_points === 12 &&
  score.sprint_3rd_points === 12 &&
  score.race_1st_points === 12 &&
  score.race_2nd_points === 12 &&
  score.race_3rd_points === 12 &&
  score.glorious_7_points === 36 &&
  score.penalty_points === 0
) {
  passed += 8
  console.log('✅ Perfect predictions = 108 total points (9 positions × 12)')
} else {
  failed += 8
  console.log(`❌ Score calculation failed`)
}
console.log()

// Test with late submission
const latePrediction = { ...mockPrediction, is_late: true }
const lateScore = calculateRaceScore(latePrediction, sprintResults, raceResults, 0, gloriousRiderIds)

if (lateScore.penalty_points === 10) {
  passed++
  console.log(`✅ Late submission penalty (1st offense): -${lateScore.penalty_points} points`)
} else {
  failed++
  console.log(`❌ Late penalty: Expected -10, got -${lateScore.penalty_points}`)
}
console.log()

// ============================================================================
// Test 6: Result Validation
// ============================================================================
console.log('📊 Test 6: Race Results Validation')
console.log('-----------------------------------')

const validResults: RaceResult[] = [
  { id: 'r1', race_id: 'race1', result_type: 'race', position: 1, rider_id: 'rider1' },
  { id: 'r2', race_id: 'race1', result_type: 'race', position: 2, rider_id: 'rider2' },
  { id: 'r3', race_id: 'race1', result_type: 'race', position: 3, rider_id: 'rider3' },
]

const validation1 = validateRaceResults(validResults)
if (validation1.valid) {
  console.log('✅ Valid results pass validation')
  passed++
} else {
  console.log(`❌ Valid results failed: ${validation1.error}`)
  failed++
}

const duplicateResults: RaceResult[] = [
  { id: 'r1', race_id: 'race1', result_type: 'race', position: 1, rider_id: 'rider1' },
  { id: 'r2', race_id: 'race1', result_type: 'race', position: 1, rider_id: 'rider2' },
]

const validation2 = validateRaceResults(duplicateResults)
if (!validation2.valid && validation2.error?.includes('Duplicate')) {
  console.log('✅ Duplicate positions detected correctly')
  passed++
} else {
  console.log('❌ Duplicate positions not detected')
  failed++
}

const missingResults: RaceResult[] = [
  { id: 'r1', race_id: 'race1', result_type: 'race', position: 1, rider_id: 'rider1' },
  { id: 'r2', race_id: 'race1', result_type: 'race', position: 3, rider_id: 'rider2' },
]

const validation3 = validateRaceResults(missingResults)
if (!validation3.valid && validation3.error?.includes('Missing')) {
  console.log('✅ Missing positions detected correctly')
  passed++
} else {
  console.log('❌ Missing positions not detected')
  failed++
}
console.log()

// ============================================================================
// Summary
// ============================================================================
console.log('='.repeat(50))
console.log(`Test Summary: ${passed} passed, ${failed} failed`)
console.log('='.repeat(50))

if (failed === 0) {
  console.log('✅ All tests passed! Scoring engine is working correctly.')
  process.exit(0)
} else {
  console.log(`❌ ${failed} test(s) failed. Please review the scoring logic.`)
  process.exit(1)
}
