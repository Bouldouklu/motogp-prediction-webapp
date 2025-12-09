# Scoring System Update Walkthrough

## Summary
The scoring system has been updated to be more balanced and impactful.
*   **Championship Prediction**: Increased from 87 pts to **450 pts** (equivalent to 2 perfect weekends).
*   **Race Weekend**: Sharpened scale (25-18-15-10-6-2) to heavily reward exact predictions while maintaining good points for "Right Riders, Wrong Order".
*   **User Interface**: Added a new `/scoring` page to explain these rules to players.

## Changes Verified

### 1. Scoring Logic
*   Checked `lib/scoring.ts` to ensure new point values are used.
*   Ran `node scripts/test-scoring-simple.js` which passed all 28 tests with the new expected values.

### 2. Documentation
*   Updated `SCORING_ENGINE.md` and `motogp-betting-spec.md` to match the new logic.

### 3. User Interface
*   **New Page**: Created `app/scoring/page.tsx` with a clear breakdown of points.
*   **Navigation**: Added a "Scoring" link to the Footer for easy access.

## Screenshots

<!-- slide -->
### Scoring Rules Page
The new page explaining the system to players.
![Scoring Page](/scoring-page-mockup.png)
*(Note: Real screenshot to be captured by user)*
<!-- slide -->
