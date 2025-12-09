# Task Checklist

- [x] Update scoring logic in `lib/scoring.ts`
    - [x] Update `calculatePositionPoints` with new scale (25, 18, 15...)
    - [x] Update `calculateChampionshipPoints` with new values (100, 50, 50)
- [x] Update test suites
    - [x] Update `lib/scoring.test.ts` expected values
    - [x] Update `scripts/test-scoring-simple.js` expected values
- [x] Update documentation
    - [x] Update `SCORING_ENGINE.md`
    - [x] Update `motogp-betting-spec.md`
- [x] Verification
    - [x] Run `npm test` or `npx jest` (checking package.json for test script)
    - [x] Run `node scripts/test-scoring-simple.js`
- [x] User Interface
    - [x] Create `/scoring` page or rules modal to explain system to players
