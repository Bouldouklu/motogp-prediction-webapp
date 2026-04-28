import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { calculateAndSaveRaceScores } from '@/lib/score-runner'

export async function POST() {
    try {
        const user = await getCurrentUser()
        if (!user || user.name.toLowerCase() !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = createServiceClient()

        // Find all races that have results entered
        const { data: racesWithResults, error } = await supabase
            .from('race_results')
            .select('race_id')

        if (error) {
            return NextResponse.json({ error: 'Failed to fetch races with results' }, { status: 500 })
        }

        const raceIds = [...new Set((racesWithResults || []).map((r: { race_id: string }) => r.race_id))]

        if (raceIds.length === 0) {
            return NextResponse.json({ racesProcessed: 0, totalScoresCalculated: 0, errors: [] })
        }

        const results = await Promise.all(raceIds.map(raceId => calculateAndSaveRaceScores(raceId, supabase)))

        const errors = results.filter(r => r.error).map(r => ({ raceId: r.raceId, error: r.error }))
        const totalScoresCalculated = results.reduce((sum, r) => sum + r.scoresCalculated, 0)

        return NextResponse.json({
            racesProcessed: results.filter(r => !r.error).length,
            totalScoresCalculated,
            errors,
        })
    } catch (error) {
        console.error('Error in recalculate-all:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
