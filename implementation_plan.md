# Scoring System Implementation Plan

## Goal Description
Implement the new "balanced" scoring system as agreed in the `scoring_suggestion.md` specification. The goal is to increase the weight of the Championship prediction (from 87 to 450 points) and sharpen the Race Weekend scoring (from 12-9-7... to 25-18-15...) to better reward accuracy and importance.

## User Review Required
> [!IMPORTANT]
> This is a functional change to the core scoring logic. Any existing scores in the database will need to be recalculated (using the admin recalculation endpoint) to reflect these new values.

## Proposed Changes

### Logic Layer
#### [MODIFY] [scoring.ts](file:///d:/DevFolder/motogp-prediction-webapp/lib/scoring.ts)
- Update `calculatePositionPoints`:
  - Exact match: 25 pts (was 12)
  - Off by 1: 18 pts (was 9)
  - Off by 2: 15 pts (was 7)
  - Off by 3: 10 pts (was 5)
  - Off by 4: 6 pts (was 4)
  - Off by 5: 2 pts (was 2)
  - Off by 6+: 0 pts (unchanged)
- Update `calculateChampionshipPoints`:
  - 1st place: 250 pts (was 37)
  - 2nd place: 100 pts (was 25)
  - 3rd place: 100 pts (was 25)
  - Total: 450 pts (Exactly 2x Perfect Weekend of 225)

### Documentation
#### [MODIFY] [SCORING_ENGINE.md](file:///d:/DevFolder/motogp-prediction-webapp/SCORING_ENGINE.md)
- Update "Scoring Rules" section with new tables.
- Update example calculations to reflect new point values.

#### [MODIFY] [motogp-betting-spec.md](file:///d:/DevFolder/motogp-prediction-webapp/motogp-betting-spec.md)
- Update "Scoring System" section to match new specification.

## Verification Plan

### Automated Tests
- **Jest / Console Tests**:
  - Run `node scripts/test-scoring-simple.js`
  - This script manually validates the scoring functions. I will update this script to assert the *new* expected values.
  - Run `npm test` (running `lib/scoring.test.ts`)
  - I will update `lib/scoring.test.ts` to assert the *new* expected values.

### Manual Verification
- Review the `scripts/test-scoring-simple.js` output to ensure all checks pass with the new values (e.g., verifying a perfect weekend score is 225 and Championship is 450).
