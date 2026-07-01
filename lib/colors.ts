/**
 * Central color grammar for all results & ranking surfaces.
 *
 * One meaning per color:
 * - Podium (gold / silver / bronze) → rank P1/P2/P3 only.
 * - Amber intensity → how big a score is (pale → vivid). Single hue, no green/yellow/orange scale.
 * - Red → penalty / DNF only.
 * - Blue → the current player ("you") only.
 * - Green → the "exact prediction" ✓ marker only.
 */

// Podium — gold / silver / bronze, rank only (index 0 = P1, 1 = P2, 2 = P3)
export const PODIUM_TEXT = ['text-amber-300', 'text-slate-300', 'text-amber-700'] as const
export const PODIUM_RING = ['ring-1 ring-amber-300', 'ring-1 ring-slate-300', 'ring-1 ring-amber-700'] as const

/**
 * Score intensity — single-hue amber gradient based on the ratio score/max,
 * so it stays readable whatever the scoring scale in play.
 */
export function scoreIntensity(pts: number | undefined, max: number): string {
  if (!pts || pts <= 0) return 'text-gray-500'
  const r = Math.min(pts / (max || 1), 1)
  if (r >= 0.75) return 'text-amber-300 font-bold'
  if (r >= 0.45) return 'text-amber-400/90'
  if (r >= 0.2) return 'text-amber-400/60'
  return 'text-amber-400/40'
}

/** Reference maxima for score intensity, per surface. */
export const MAX_RACE_SCORE = 120 // full weekend score in one matrix cell
export const MAX_SLOT_SCORE = 25 // a single podium-slot prediction

export const PENALTY_TEXT = 'text-red-500' // penalty / DNF, unified
export const EXACT_TEXT = 'text-green-400' // "exact prediction" ✓ marker only
export const YOU_TEXT = 'text-blue-400' // current player only
export const YOU_ROW = 'bg-blue-950/40 border-l-2 border-blue-500' // current player row highlight
