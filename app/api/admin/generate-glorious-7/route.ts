import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser()

        // Simple admin check based on name as per spec/policy
        // In a real app this would be more robust
        if (!user || user.name.toLowerCase() !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { raceId } = await request.json()
        if (!raceId) {
            return NextResponse.json({ error: 'Race ID is required' }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Get all active riders
        const { data: riders, error: ridersError } = await supabase
            .from('riders')
            .select('id, name')
            .eq('active', true)

        if (ridersError || !riders) {
            return NextResponse.json({ error: 'Failed to fetch riders' }, { status: 500 })
        }

        // 2. Get current championship standings
        // For simplicity in this first version, we'll calculate standings from `player_scores` or just assume
        // we need to implement a proper standings calculation. 
        // Wait, the requirement says "NOT in the top 3 NOR in the bottom 3 of the championship".
        // We need championship standings for RIDERS, not players.
        // The table `championship_results` is for FINAL results.
        // Is there a running championship standings for riders?
        // Checking schema... `race_results` has `position` and `rider_id`.
        // We can calculate running total points for riders based on `race_results`.

        // Calculate rider points so far
        const { data: results, error: resultsError } = await supabase
            .from('race_results')
            .select('result_type, position, rider_id, races!inner(round_number)')
        // We should ideally filter by year, but for now assuming all current season

        if (resultsError) {
            return NextResponse.json({ error: 'Failed to fetch results for standings' }, { status: 500 })
        }

        // Map position to points (standard MotoGP scoring)
        const getPoints = (pos: number, type: string) => {
            // Full race points
            const racePoints: Record<number, number> = {
                1: 25, 2: 20, 3: 16, 4: 13, 5: 11, 6: 10, 7: 9, 8: 8, 9: 7, 10: 6,
                11: 5, 12: 4, 13: 3, 14: 2, 15: 1
            }
            // Sprint points
            const sprintPoints: Record<number, number> = {
                1: 12, 2: 9, 3: 7, 4: 6, 5: 5, 6: 4, 7: 3, 8: 2, 9: 1
            }
            return type === 'sprint' ? (sprintPoints[pos] || 0) : (racePoints[pos] || 0)
        }

        const riderPoints = new Map<string, number>()
        // Initialize all riders with 0
        riders.forEach(r => riderPoints.set(r.id, 0))

        results?.forEach(r => {
            const p = riderPoints.get(r.rider_id) || 0
            riderPoints.set(r.rider_id, p + getPoints(r.position, r.result_type))
        })

        // Sort riders by points
        const sortedRiders = [...riders].sort((a, b) => {
            return (riderPoints.get(b.id) || 0) - (riderPoints.get(a.id) || 0)
        })

        // "Glorious 7" = Random 7 from (All - Top 3 - Bottom 3)
        // If we don't have enough riders (e.g. start of season), we might need fallback logic.
        // Let's assume we have at least 13 riders (3+3+7). 2026 grid has 22 riders.

        const n = sortedRiders.length
        if (n < 7) {
            return NextResponse.json({ error: 'Not enough riders to select 7' }, { status: 400 })
        }

        let eligibleRiders = sortedRiders
        if (n >= 13) {
            // Remove top 3 and bottom 3
            eligibleRiders = sortedRiders.slice(3, n - 3)
        } else {
            // Just take what we can if not enough (fallback)
            // minimal exclusion logic?
        }

        // Randomly select 7
        const shuffled = eligibleRiders.sort(() => 0.5 - Math.random())
        const selected = shuffled.slice(0, 7)

        // Save to race_glorious_riders
        // First clear existing for this race
        await supabase.from('race_glorious_riders').delete().eq('race_id', raceId)

        const inserts = selected.map((r, i) => ({
            race_id: raceId,
            rider_id: r.id,
            display_order: i + 1
        }))

        const { error: insertError } = await supabase
            .from('race_glorious_riders')
            .insert(inserts)

        if (insertError) {
            return NextResponse.json({ error: 'Failed to save glorious riders' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            riders: selected.map(r => ({ ...r, points: riderPoints.get(r.id) }))
        })

    } catch (error) {
        console.error('Error generating glorious riders:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
