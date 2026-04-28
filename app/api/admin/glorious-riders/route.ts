import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user || user.name.toLowerCase() !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { raceId, riderIds } = await request.json()

        if (!raceId) {
            return NextResponse.json({ error: 'Race ID is required' }, { status: 400 })
        }
        if (!Array.isArray(riderIds) || riderIds.length !== 7) {
            return NextResponse.json({ error: 'Exactly 7 rider IDs are required' }, { status: 400 })
        }
        if (new Set(riderIds).size !== 7) {
            return NextResponse.json({ error: 'Rider IDs must be unique' }, { status: 400 })
        }

        const supabase = await createClient()

        await supabase.from('race_glorious_riders').delete().eq('race_id', raceId)

        const inserts = riderIds.map((riderId: string, i: number) => ({
            race_id: raceId,
            rider_id: riderId,
            display_order: i + 1,
        }))

        const { error: insertError } = await supabase
            .from('race_glorious_riders')
            .insert(inserts)

        if (insertError) {
            return NextResponse.json({ error: 'Failed to save glorious riders' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error saving glorious riders:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
