import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { validateRaceResults, type RaceResult } from '@/lib/scoring'

/**
 * POST /api/admin/results
 * Save race results (sprint and/or race)
 *
 * Request body:
 * {
 *   raceId: string;
 *   sprintResults?: Array<{position: number, riderId: string}>;
 *   raceResults?: Array<{position: number, riderId: string}>;
 * }
 *
 * This endpoint:
 * 1. Checks admin authentication
 * 2. Validates results (no duplicates, sequential positions)
 * 3. Deletes existing results for the race (allows recalculation)
 * 4. Inserts new results
 * 5. Updates race status to 'completed' if both sprint and race submitted
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabase = await createClient()
    const body = await request.json()
    const { raceId, sprintResults, raceResults } = body

    // Validate request
    if (!raceId) {
      return NextResponse.json({ error: 'raceId is required' }, { status: 400 })
    }

    if (!sprintResults && !raceResults) {
      return NextResponse.json(
        { error: 'At least one of sprintResults or raceResults is required' },
        { status: 400 }
      )
    }

    // Verify race exists
    const { data: race, error: raceError } = await supabase
      .from('races')
      .select('id, name')
      .eq('id', raceId)
      .single()

    if (raceError || !race) {
      return NextResponse.json({ error: 'Race not found' }, { status: 404 })
    }

    let sprintCount = 0
    let raceCount = 0

    // Process sprint results if provided
    if (sprintResults && Array.isArray(sprintResults) && sprintResults.length > 0) {
      // Validate sprint results
      const sprintResultsFormatted: RaceResult[] = sprintResults.map((r: any) => ({
        id: '',
        race_id: raceId,
        result_type: 'sprint' as const,
        position: r.position,
        rider_id: r.riderId,
      }))

      const sprintValidation = validateRaceResults(sprintResultsFormatted)
      if (!sprintValidation.valid) {
        return NextResponse.json(
          { error: `Sprint results validation failed: ${sprintValidation.error}` },
          { status: 400 }
        )
      }

      // Verify all riders exist
      const riderIds = sprintResults.map((r: any) => r.riderId)
      const { data: riders, error: ridersError } = await supabase
        .from('riders')
        .select('id')
        .in('id', riderIds)

      if (ridersError || !riders || riders.length !== riderIds.length) {
        return NextResponse.json(
          { error: 'One or more rider IDs are invalid' },
          { status: 400 }
        )
      }

      // Delete existing sprint results for this race
      const { error: deleteError } = await supabase
        .from('race_results')
        .delete()
        .eq('race_id', raceId)
        .eq('result_type', 'sprint')

      if (deleteError) {
        console.error('Error deleting existing sprint results:', deleteError)
        return NextResponse.json(
          { error: 'Failed to delete existing sprint results' },
          { status: 500 }
        )
      }

      // Insert new sprint results
      const sprintData = sprintResults.map((r: any) => ({
        race_id: raceId,
        result_type: 'sprint',
        position: r.position,
        rider_id: r.riderId,
      }))

      const { error: insertError } = await supabase.from('race_results').insert(sprintData)

      if (insertError) {
        console.error('Error inserting sprint results:', insertError)
        return NextResponse.json({ error: 'Failed to save sprint results' }, { status: 500 })
      }

      sprintCount = sprintData.length
    }

    // Process race results if provided
    if (raceResults && Array.isArray(raceResults) && raceResults.length > 0) {
      // Validate race results
      const raceResultsFormatted: RaceResult[] = raceResults.map((r: any) => ({
        id: '',
        race_id: raceId,
        result_type: 'race' as const,
        position: r.position,
        rider_id: r.riderId,
      }))

      const raceValidation = validateRaceResults(raceResultsFormatted)
      if (!raceValidation.valid) {
        return NextResponse.json(
          { error: `Race results validation failed: ${raceValidation.error}` },
          { status: 400 }
        )
      }

      // Verify all riders exist
      const riderIds = raceResults.map((r: any) => r.riderId)
      const { data: riders, error: ridersError } = await supabase
        .from('riders')
        .select('id')
        .in('id', riderIds)

      if (ridersError || !riders || riders.length !== riderIds.length) {
        return NextResponse.json(
          { error: 'One or more rider IDs are invalid' },
          { status: 400 }
        )
      }

      // Delete existing race results for this race
      const { error: deleteError } = await supabase
        .from('race_results')
        .delete()
        .eq('race_id', raceId)
        .eq('result_type', 'race')

      if (deleteError) {
        console.error('Error deleting existing race results:', deleteError)
        return NextResponse.json(
          { error: 'Failed to delete existing race results' },
          { status: 500 }
        )
      }

      // Insert new race results
      const raceData = raceResults.map((r: any) => ({
        race_id: raceId,
        result_type: 'race',
        position: r.position,
        rider_id: r.riderId,
      }))

      const { error: insertError } = await supabase.from('race_results').insert(raceData)

      if (insertError) {
        console.error('Error inserting race results:', insertError)
        return NextResponse.json({ error: 'Failed to save race results' }, { status: 500 })
      }

      raceCount = raceData.length
    }

    // Update race status to completed if both sprint and race results are saved
    if (sprintCount > 0 && raceCount > 0) {
      const { error: updateError } = await supabase
        .from('races')
        .update({ status: 'completed' })
        .eq('id', raceId)

      if (updateError) {
        console.error('Error updating race status:', updateError)
        // Don't fail the entire operation if status update fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Race results saved successfully',
      sprintResultsCount: sprintCount,
      raceResultsCount: raceCount,
    })
  } catch (error) {
    console.error('Unexpected error in results API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
