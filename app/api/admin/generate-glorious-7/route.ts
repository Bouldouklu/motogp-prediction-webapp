import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

const MANUFACTURERS = ['Ducati', 'Honda', 'Yamaha', 'KTM', 'Aprilia', 'Suzuki']

function getManufacturer(team: string): string {
    return MANUFACTURERS.find(m => team.includes(m)) ?? team
}

function getPoints(pos: number, type: string): number {
    const racePoints: Record<number, number> = {
        1: 25, 2: 20, 3: 16, 4: 13, 5: 11, 6: 10, 7: 9, 8: 8, 9: 7, 10: 6,
        11: 5, 12: 4, 13: 3, 14: 2, 15: 1,
    }
    const sprintPoints: Record<number, number> = {
        1: 12, 2: 9, 3: 7, 4: 6, 5: 5, 6: 4, 7: 3, 8: 2, 9: 1,
    }
    return type === 'sprint' ? (sprintPoints[pos] || 0) : (racePoints[pos] || 0)
}

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user || user.name.toLowerCase() !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const raceId = request.nextUrl.searchParams.get('raceId')
        if (!raceId) {
            return NextResponse.json({ error: 'Race ID is required' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data, error } = await supabase
            .from('race_glorious_riders')
            .select('display_order, riders(id, name, number, team, active)')
            .eq('race_id', raceId)
            .order('display_order', { ascending: true })

        if (error) {
            return NextResponse.json({ error: 'Failed to fetch glorious riders' }, { status: 500 })
        }

        const riders = (data || []).map((row: any) => row.riders)
        return NextResponse.json({ riders })
    } catch (error) {
        console.error('Error fetching glorious riders:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user || user.name.toLowerCase() !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { raceId } = await request.json()
        if (!raceId) {
            return NextResponse.json({ error: 'Race ID is required' }, { status: 400 })
        }

        const supabase = await createClient()

        const { data: riders, error: ridersError } = await supabase
            .from('riders')
            .select('id, name, number, team')
            .eq('active', true)

        if (ridersError || !riders) {
            return NextResponse.json({ error: 'Failed to fetch riders' }, { status: 500 })
        }

        const { data: results, error: resultsError } = await supabase
            .from('race_results')
            .select('result_type, position, rider_id')

        if (resultsError) {
            return NextResponse.json({ error: 'Failed to fetch results for standings' }, { status: 500 })
        }

        const riderPoints = new Map<string, number>()
        riders.forEach(r => riderPoints.set(r.id, 0))
        results?.forEach(r => {
            const p = riderPoints.get(r.rider_id) || 0
            riderPoints.set(r.rider_id, p + getPoints(r.position, r.result_type))
        })

        const sortedRiders = [...riders].sort((a, b) =>
            (riderPoints.get(b.id) || 0) - (riderPoints.get(a.id) || 0)
        )

        const n = sortedRiders.length
        if (n < 7) {
            return NextResponse.json({ error: 'Not enough riders to select 7' }, { status: 400 })
        }

        const eligibleRiders = n >= 13 ? sortedRiders.slice(3, n - 3) : sortedRiders

        // Shuffle then apply manufacturer cap (max 2 per manufacturer)
        const shuffled = [...eligibleRiders].sort(() => 0.5 - Math.random())
        const manufacturerCount = new Map<string, number>()
        const selected: typeof riders = []
        for (const rider of shuffled) {
            if (selected.length >= 7) break
            const mfr = getManufacturer(rider.team || '')
            const count = manufacturerCount.get(mfr) || 0
            if (count < 2) {
                selected.push(rider)
                manufacturerCount.set(mfr, count + 1)
            }
        }

        if (selected.length < 7) {
            return NextResponse.json({ error: 'Could not find 7 eligible riders with manufacturer cap' }, { status: 400 })
        }

        await supabase.from('race_glorious_riders').delete().eq('race_id', raceId)

        const inserts = selected.map((r, i) => ({
            race_id: raceId,
            rider_id: r.id,
            display_order: i + 1,
        }))

        const { error: insertError } = await supabase
            .from('race_glorious_riders')
            .insert(inserts)

        if (insertError) {
            return NextResponse.json({ error: 'Failed to save glorious riders' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            riders: selected.map(r => ({ ...r, points: riderPoints.get(r.id) })),
        })
    } catch (error) {
        console.error('Error generating glorious riders:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
