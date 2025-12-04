# MotoGP Scoring Engine Documentation

## Overview

The scoring engine is the core component that calculates player points based on their race predictions and actual race results. It handles:

- Sprint winner predictions
- Race winner predictions
- Glorious 7th place predictions
- Late submission penalties
- Championship predictions (end of season)

## Scoring Rules

### Race Winner Predictions (Sprint & Main Race)

Points are awarded based on how close the predicted rider finishes to 1st place:

| Accuracy | Points |
|----------|--------|
| Exact match (1st place) | 12 |
| Off by 1 position (2nd) | 9 |
| Off by 2 positions (3rd) | 7 |
| Off by 3 positions (4th) | 5 |
| Off by 4 positions (5th) | 4 |
| Off by 5 positions (6th) | 2 |
| Off by 6+ positions | 0 |

### Glorious 7 Prediction

Points are awarded based on how close the predicted rider finishes to 7th place:

| Accuracy | Points |
|----------|--------|
| Exact 7th place | 12 |
| Off by 1 position (6th or 8th) | 9 |
| Off by 2 positions (5th or 9th) | 7 |
| Off by 3 positions (4th or 10th) | 5 |
| Off by 4 positions (3rd or 11th) | 4 |
| Off by 5+ positions | 0 |

### Late Submission Penalties

Progressive penalties apply for late submissions:

| Offense | Penalty |
|---------|---------|
| 1st late submission | -10 points |
| 2nd late submission | -25 points |
| 3rd+ late submissions | -50 points each |

### Championship Predictions

End-of-season points for predicting the final championship standings:

| Position Correct | Points |
|------------------|--------|
| 1st place correct | 37 |
| 2nd place correct | 25 |
| 3rd place correct | 25 |
| **Maximum Total** | **87** |

## Architecture

### Core Files

```
lib/
  scoring.ts              # Core scoring logic and calculation functions

app/api/scores/
  calculate/route.ts      # API endpoint to calculate and store scores
  breakdown/route.ts      # API endpoint to get detailed score breakdowns
  history/route.ts        # API endpoint to get player historical scores

components/
  ScoreBreakdown.tsx      # Component to display detailed score breakdown
  ScoreHistory.tsx        # Component to display player score history

scripts/
  test-scoring-simple.js  # Test script to verify scoring logic
```

## API Endpoints

### POST /api/scores/calculate

Calculate and store scores for a specific race.

**Request:**
```json
{
  "raceId": "uuid-of-race"
}
```

**Response:**
```json
{
  "success": true,
  "scoresCalculated": 9,
  "penaltiesApplied": 2,
  "scores": [
    {
      "player_id": "uuid",
      "race_id": "uuid",
      "sprint_points": 12,
      "race_points": 9,
      "glorious_7_points": 7,
      "penalty_points": 0
    }
  ]
}
```

**Features:**
- Validates race results are complete and correct
- Calculates scores for all players who made predictions
- Stores scores in `player_scores` table
- Creates penalty records for late submissions
- Handles recalculation (upserts existing scores)

### GET /api/scores/calculate?raceId=xxx

Preview score calculation without storing to database.

**Query Parameters:**
- `raceId` (required): UUID of the race

**Response:**
```json
{
  "preview": true,
  "scores": [...]
}
```

### GET /api/scores/breakdown?raceId=xxx&playerId=xxx

Get detailed score breakdown with rider names and positions.

**Query Parameters:**
- `raceId` (required): UUID of the race
- `playerId` (optional): UUID of specific player

**Response:**
```json
{
  "race": {
    "id": "uuid",
    "name": "Thailand",
    "round_number": 1
  },
  "breakdowns": [
    {
      "player_id": "uuid",
      "player_name": "Gil",
      "race_id": "uuid",
      "race_name": "Thailand",
      "sprint_winner_prediction": "Marc Marquez (#93) - Finished P1",
      "sprint_winner_actual": "Marc Marquez (#93)",
      "sprint_points": 12,
      "race_winner_prediction": "Jorge Martin (#89) - Finished P2",
      "race_winner_actual": "Marc Marquez (#93)",
      "race_points": 9,
      "glorious_7_prediction": "Fabio Quartararo (#20) - Finished P7",
      "glorious_7_actual": "Fabio Quartararo (#20)",
      "glorious_7_points": 12,
      "penalty_points": 0,
      "total_points": 33,
      "is_late": false
    }
  ]
}
```

### GET /api/scores/history?playerId=xxx

Get complete season history for a player.

**Query Parameters:**
- `playerId` (required): UUID of the player
- `season` (optional): Year (defaults to 2026)

**Response:**
```json
{
  "player": {
    "id": "uuid",
    "name": "Gil"
  },
  "season": 2026,
  "summary": {
    "total_races": 22,
    "races_completed": 10,
    "races_predicted": 10,
    "total_points": 315,
    "average_points_per_race": 31.5,
    "late_submissions": 1,
    "total_penalties": 1,
    "total_penalty_points": 10
  },
  "history": [
    {
      "race_id": "uuid",
      "round_number": 1,
      "race_name": "Thailand",
      "race_date": "2026-03-01",
      "status": "completed",
      "has_prediction": true,
      "prediction_submitted_at": "2026-02-28T10:00:00Z",
      "is_late": false,
      "sprint_points": 12,
      "race_points": 9,
      "glorious_7_points": 12,
      "penalty_points": 0,
      "total_points": 33,
      "running_total": 33,
      "penalties": []
    }
  ]
}
```

## Core Functions

### calculatePositionPoints()

Calculate points based on position difference.

```typescript
calculatePositionPoints(
  predictedPosition: number,
  actualPosition: number,
  type: 'winner' | 'glorious7'
): number
```

**Example:**
```typescript
// Predicted winner finished 2nd
calculatePositionPoints(2, 1, 'winner') // Returns 9

// Predicted glorious 7 finished 8th
calculatePositionPoints(8, 7, 'glorious7') // Returns 9
```

### calculateRaceScore()

Calculate complete score for a single player's race predictions.

```typescript
calculateRaceScore(
  prediction: RacePrediction,
  sprintResults: RaceResult[],
  raceResults: RaceResult[],
  lateSubmissionCount: number = 0
): PlayerScore
```

### calculateAllRaceScores()

Calculate scores for all players for a given race.

```typescript
calculateAllRaceScores(
  predictions: RacePrediction[],
  sprintResults: RaceResult[],
  raceResults: RaceResult[],
  playerLateSubmissionCounts: Map<string, number>
): PlayerScore[]
```

### validateRaceResults()

Validate that race results are complete and correct.

```typescript
validateRaceResults(
  results: RaceResult[]
): { valid: boolean; error?: string }
```

**Checks:**
- No duplicate positions
- No missing positions (should be sequential 1, 2, 3, ...)

## Components

### ScoreBreakdown

Display detailed score breakdown for a race.

```tsx
<ScoreBreakdown raceId="uuid" playerId="uuid-optional" />
```

**Features:**
- Shows predicted vs actual riders with position info
- Color-coded points (green for high, gray for low)
- Displays late submission penalties
- Calculates and shows totals

### ScoreHistory

Display complete season history for a player.

```tsx
<ScoreHistory playerId="uuid" />
```

**Features:**
- Summary statistics (total points, average, penalties)
- Race-by-race table with all details
- Running total column
- Status indicators (scored, predicted, pending)

## Database Schema

### player_scores

Stores calculated scores for each player per race.

```sql
CREATE TABLE player_scores (
  id UUID PRIMARY KEY,
  player_id UUID REFERENCES players(id),
  race_id UUID REFERENCES races(id),
  sprint_points INT DEFAULT 0,
  race_points INT DEFAULT 0,
  glorious_7_points INT DEFAULT 0,
  penalty_points INT DEFAULT 0,
  total_points INT GENERATED ALWAYS AS
    (sprint_points + race_points + glorious_7_points - penalty_points) STORED,
  UNIQUE(player_id, race_id)
);
```

**Note:** `total_points` is a generated column that automatically calculates the sum.

### penalties

Tracks penalty records for audit purposes.

```sql
CREATE TABLE penalties (
  id UUID PRIMARY KEY,
  player_id UUID REFERENCES players(id),
  race_id UUID REFERENCES races(id),
  offense_number INT NOT NULL,
  penalty_points INT NOT NULL,
  reason VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Testing

Run the test suite to verify scoring logic:

```bash
node scripts/test-scoring-simple.js
```

**Tests cover:**
- Winner position points (7 test cases)
- Glorious 7 position points (11 test cases)
- Late submission penalties (4 test cases)
- Championship points (3 test cases)
- Complete race scenarios (2 test cases)
- Result validation

All 27 tests should pass.

## Usage Workflow

### Admin Workflow: Enter Results and Calculate Scores

1. **Enter race results** (via admin panel):
   - Sprint results: positions 1-20 with rider IDs
   - Main race results: positions 1-20 with rider IDs

2. **Calculate scores** (automatic or manual trigger):
   ```typescript
   POST /api/scores/calculate
   {
     "raceId": "race-uuid"
   }
   ```

3. **View score breakdowns**:
   - Admin can review detailed breakdowns
   - Check for any anomalies or disputes

### Player Workflow: View Scores

1. **View score breakdown** for a specific race:
   ```tsx
   <ScoreBreakdown raceId="race-uuid" playerId="player-uuid" />
   ```

2. **View historical scores**:
   ```tsx
   <ScoreHistory playerId="player-uuid" />
   ```

3. **Check leaderboard** (uses `player_scores` data):
   - Aggregates all race scores
   - Adds championship prediction points (if season ended)
   - Sorts by total points

## Error Handling

### Common Errors

**Invalid race results:**
```json
{
  "error": "Invalid sprint results: Duplicate positions found in results"
}
```

**Missing results:**
```json
{
  "error": "Sprint results not found for this race"
}
```

**No predictions:**
```json
{
  "message": "No predictions found for this race",
  "scoresCalculated": 0
}
```

### Validation

The scoring engine validates:
- Race results have no duplicate positions
- Race results have sequential positions (no gaps)
- All required data is present before calculation

## Performance Considerations

1. **Denormalization**: Scores are stored in `player_scores` table rather than calculated on-the-fly
2. **Generated columns**: `total_points` is calculated by PostgreSQL automatically
3. **Indexes**: Proper indexes on `player_id` and `race_id` for fast lookups
4. **Upserts**: Scores can be recalculated and updated without creating duplicates

## Future Enhancements

Potential improvements for the scoring engine:

1. **Automatic scoring**: Trigger score calculation immediately when results are entered
2. **Real-time updates**: Use Supabase subscriptions to push score updates to clients
3. **Dispute handling**: Allow players to flag scores for admin review
4. **Performance charts**: Visualize score progression over the season
5. **Prediction accuracy**: Track and display which players are most accurate
6. **Bonus points**: Consider additional scoring categories (fastest lap, etc.)

## Troubleshooting

### Scores don't appear after calculation

- Check that race results exist for both sprint and race
- Verify predictions exist for that race
- Check console logs for validation errors
- Ensure database RLS policies allow score writes

### Penalty not applied

- Verify `is_late` flag is set on the prediction
- Check that `countLateSubmissions()` is counting correctly
- Ensure previous race data is available for counting

### Total points don't match

- Remember that `total_points` is generated automatically
- Don't try to set `total_points` manually in upserts
- Recalculate if results were corrected after initial scoring

## Support

For issues or questions about the scoring engine:

1. Run tests: `node scripts/test-scoring-simple.js`
2. Check API responses for error messages
3. Review database logs in Supabase dashboard
4. Verify race results are complete and valid

---

**Last Updated**: December 2025
**Version**: 1.0.0
