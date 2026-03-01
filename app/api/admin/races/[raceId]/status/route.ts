import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'

const VALID_STATUSES = ['upcoming', 'in_progress', 'completed'] as const
type RaceStatus = (typeof VALID_STATUSES)[number]

/**
 * PATCH /api/admin/races/[raceId]/status
 * Explicitly update a race's status. Requires admin auth.
 *
 * Body: { status: 'upcoming' | 'in_progress' | 'completed' }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ raceId: string }> }
) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { raceId } = await params
    const body = await request.json()
    const { status } = body as { status: RaceStatus }

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: race, error: raceError } = await supabase
      .from('races')
      .select('id, name')
      .eq('id', raceId)
      .single()

    if (raceError || !race) {
      return NextResponse.json({ error: 'Race not found' }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from('races')
      .update({ status })
      .eq('id', raceId)

    if (updateError) {
      console.error('Error updating race status:', updateError)
      return NextResponse.json({ error: 'Failed to update race status' }, { status: 500 })
    }

    return NextResponse.json({ success: true, raceId, status })
  } catch (error) {
    console.error('Unexpected error in race status API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
