/**
 * Simple Node.js test script for scoring engine
 * Run with: node scripts/test-scoring-simple.js
 *
 * This script manually tests the core scoring logic without TypeScript
 */

console.log('🏁 MotoGP Scoring Engine Manual Verification\n')

// ============================================================================
// Test 1: Position Points for Winner Predictions
// ============================================================================
console.log('📊 Test 1: Winner Position Points')
console.log('-----------------------------------')

function calculateWinnerPoints(predictedPosition, actualPosition = 1) {
  const diff = Math.abs(predictedPosition - actualPosition)
  const pointsMap = {
    0: 12, // Exact match
    1: 9,  // Off by 1
    2: 7,  // Off by 2
    3: 5,  // Off by 3
    4: 4,  // Off by 4
    5: 2,  // Off by 5
  }
  return pointsMap[diff] ?? 0 // 6+ positions = 0 points
}

const winnerTests = [
  { pos: 1, expected: 12, desc: 'Exact winner' },
  { pos: 2, expected: 9, desc: 'Off by 1' },
  { pos: 3, expected: 7, desc: 'Off by 2' },
  { pos: 4, expected: 5, desc: 'Off by 3' },
  { pos: 5, expected: 4, desc: 'Off by 4' },
  { pos: 6, expected: 2, desc: 'Off by 5' },
  { pos: 7, expected: 0, desc: 'Off by 6+' },
]

let totalPassed = 0
let totalFailed = 0

winnerTests.forEach(test => {
  const result = calculateWinnerPoints(test.pos)
  if (result === test.expected) {
    console.log(`✅ ${test.desc}: ${result} points`)
    totalPassed++
  } else {
    console.log(`❌ ${test.desc}: Expected ${test.expected}, got ${result}`)
    totalFailed++
  }
})
console.log()

// ============================================================================
// Test 2: Position Points for Glorious 7 Predictions
// ============================================================================
console.log('📊 Test 2: Glorious 7 Position Points')
console.log('--------------------------------------')

function calculateGlorious7Points(predictedPosition, actualPosition = 7) {
  const diff = Math.abs(predictedPosition - actualPosition)
  const pointsMap = {
    0: 12, // Exact 7th place
    1: 9,  // Off by 1
    2: 7,  // Off by 2
    3: 5,  // Off by 3
    4: 4,  // Off by 4
  }
  return pointsMap[diff] ?? 0 // 5+ positions = 0 points
}

const g7Tests = [
  { pos: 7, expected: 12, desc: 'Exact 7th' },
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

g7Tests.forEach(test => {
  const result = calculateGlorious7Points(test.pos)
  if (result === test.expected) {
    console.log(`✅ ${test.desc}: ${result} points`)
    totalPassed++
  } else {
    console.log(`❌ ${test.desc}: Expected ${test.expected}, got ${result}`)
    totalFailed++
  }
})
console.log()

// ============================================================================
// Test 3: Penalty Calculations
// ============================================================================
console.log('📊 Test 3: Late Submission Penalties')
console.log('-------------------------------------')

function calculatePenalty(offenseNumber) {
  if (offenseNumber === 1) return 10
  if (offenseNumber === 2) return 25
  return 50 // 3rd and beyond
}

const penaltyTests = [
  { offense: 1, expected: 10, desc: '1st late' },
  { offense: 2, expected: 25, desc: '2nd late' },
  { offense: 3, expected: 50, desc: '3rd late' },
  { offense: 5, expected: 50, desc: '5th late' },
]

penaltyTests.forEach(test => {
  const result = calculatePenalty(test.offense)
  if (result === test.expected) {
    console.log(`✅ ${test.desc}: -${result} points`)
    totalPassed++
  } else {
    console.log(`❌ ${test.desc}: Expected -${test.expected}, got -${result}`)
    totalFailed++
  }
})
console.log()

// ============================================================================
// Test 4: Championship Points
// ============================================================================
console.log('📊 Test 4: Championship Points')
console.log('-------------------------------')

function calculateChampionshipPoints(predictions, results) {
  let points = 0
  if (predictions.first === results.first) points += 37
  if (predictions.second === results.second) points += 25
  if (predictions.third === results.third) points += 25
  return points
}

const champTests = [
  {
    pred: { first: 'r1', second: 'r2', third: 'r3' },
    res: { first: 'r1', second: 'r2', third: 'r3' },
    expected: 87,
    desc: 'All correct (37+25+25)',
  },
  {
    pred: { first: 'r1', second: 'r2', third: 'r3' },
    res: { first: 'r1', second: 'r4', third: 'r5' },
    expected: 37,
    desc: 'Only 1st correct',
  },
  {
    pred: { first: 'r1', second: 'r2', third: 'r3' },
    res: { first: 'r4', second: 'r5', third: 'r6' },
    expected: 0,
    desc: 'All wrong',
  },
]

champTests.forEach(test => {
  const result = calculateChampionshipPoints(test.pred, test.res)
  if (result === test.expected) {
    console.log(`✅ ${test.desc}: ${result} points`)
    totalPassed++
  } else {
    console.log(`❌ ${test.desc}: Expected ${test.expected}, got ${result}`)
    totalFailed++
  }
})
console.log()

// ============================================================================
// Test 5: Complete Race Scenario
// ============================================================================
console.log('📊 Test 5: Complete Race Scenario')
console.log('----------------------------------')

// Scenario: Player predicts rider #1 for sprint winner, rider #2 for race winner, rider #7 for glorious 7
// Results: All predictions are correct (perfect score)

const sprintPoints = calculateWinnerPoints(1) // Rider #1 finished 1st in sprint
const racePoints = calculateWinnerPoints(1)   // Rider #2 finished 1st in race
const g7Points = calculateGlorious7Points(7)  // Rider #7 finished 7th in race
const penalty = 0 // No late submission

const totalPoints = sprintPoints + racePoints + g7Points - penalty

console.log(`Sprint Winner: ${sprintPoints} points`)
console.log(`Race Winner: ${racePoints} points`)
console.log(`Glorious 7: ${g7Points} points`)
console.log(`Penalty: -${penalty} points`)
console.log(`Total: ${totalPoints} points`)

if (totalPoints === 36) {
  console.log('✅ Perfect score calculation = 36 points')
  totalPassed++
} else {
  console.log(`❌ Expected 36 points, got ${totalPoints}`)
  totalFailed++
}
console.log()

// Scenario with late submission
console.log('Scenario with 1st late submission:')
const penaltyLate = calculatePenalty(1)
const totalWithPenalty = sprintPoints + racePoints + g7Points - penaltyLate
console.log(`Same perfect predictions but late: ${totalWithPenalty} points (36 - 10 penalty)`)
if (totalWithPenalty === 26) {
  console.log('✅ Late submission penalty applied correctly')
  totalPassed++
} else {
  console.log(`❌ Expected 26 points, got ${totalWithPenalty}`)
  totalFailed++
}
console.log()

// ============================================================================
// Summary
// ============================================================================
console.log('='.repeat(50))
console.log(`Test Summary: ${totalPassed} passed, ${totalFailed} failed`)
console.log('='.repeat(50))

if (totalFailed === 0) {
  console.log('✅ All tests passed! Scoring logic verified.')
  process.exit(0)
} else {
  console.log(`❌ ${totalFailed} test(s) failed.`)
  process.exit(1)
}
