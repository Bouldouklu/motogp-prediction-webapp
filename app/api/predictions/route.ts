import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { isLateSubmission } from '@/lib/scoring'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      raceId,
      sprint1stId,
      sprint2ndId,
      sprint3rdId,
      race1stId,
      race2ndId,
      race3rdId,
      glorious1stId,
      glorious2ndId,
      glorious3rdId,
    } = await request.json()

    // Validate all required fields
    if (!raceId || !sprint1stId || !sprint2ndId || !sprint3rdId ||
      !race1stId || !race2ndId || !race3rdId ||
      !glorious1stId || !glorious2ndId || !glorious3rdId) {
      return NextResponse.json(
        { error: 'All predictions are required (top 3 for sprint, top 3 for race, and top 3 for glorious 7)' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch race to check deadline
    const { data: race } = await supabase
      .from('races')
      .select('fp1_datetime')
      .eq('id', raceId)
      .single()

    if (!race) {
      return NextResponse.json({ error: 'Race not found' }, { status: 404 })
    }

    const deadline = new Date(race.fp1_datetime)
    const now = new Date()
    const late = isLateSubmission(now, deadline)

    if (late) {
      return NextResponse.json(
        { error: 'Prediction deadline has passed' },
        { status: 400 }
      )
    }

    // Insert prediction with top 3 for sprint and race
    const { data, error } = await supabase
      .from('race_predictions')
      .insert({
        player_id: user.id,
        race_id: raceId,
        sprint_1st_id: sprint1stId,
        sprint_2nd_id: sprint2ndId,
        sprint_3rd_id: sprint3rdId,
        race_1st_id: race1stId,
        race_2nd_id: race2ndId,
        race_3rd_id: race3rdId,
        glorious_1st_id: glorious1stId,
        glorious_2nd_id: glorious2ndId,
        glorious_3rd_id: glorious3rdId,
        is_late: late,
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json(
        { error: 'Failed to save prediction' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      prediction: data,
    })
  } catch (error) {
    console.error('Prediction error:', error)
    return NextResponse.json(
      { error: 'An error occurred while saving prediction' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      raceId,
      sprint1stId,
      sprint2ndId,
      sprint3rdId,
      race1stId,
      race2ndId,
      race3rdId,
      glorious1stId,
      glorious2ndId,
      glorious3rdId,
    } = await request.json()

    // Validate all required fields
    if (!raceId || !sprint1stId || !sprint2ndId || !sprint3rdId ||
      !race1stId || !race2ndId || !race3rdId ||
      !glorious1stId || !glorious2ndId || !glorious3rdId) {
      return NextResponse.json(
        { error: 'All predictions are required (top 3 for sprint, top 3 for race, and top 3 for glorious 7)' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch race to check deadline
    const { data: race } = await supabase
      .from('races')
      .select('fp1_datetime')
      .eq('id', raceId)
      .single()

    if (!race) {
      return NextResponse.json({ error: 'Race not found' }, { status: 404 })
    }

    const deadline = new Date(race.fp1_datetime)
    const now = new Date()
    const late = isLateSubmission(now, deadline)

    if (late) {
      return NextResponse.json(
        { error: 'Prediction deadline has passed' },
        { status: 400 }
      )
    }

    // Update prediction with top 3 for sprint and race
    const { data, error } = await supabase
      .from('race_predictions')
      .update({
        sprint_1st_id: sprint1stId,
        sprint_2nd_id: sprint2ndId,
        sprint_3rd_id: sprint3rdId,
        race_1st_id: race1stId,
        race_2nd_id: race2ndId,
        race_3rd_id: race3rdId,
        glorious_1st_id: glorious1stId,
        glorious_2nd_id: glorious2ndId,
        glorious_3rd_id: glorious3rdId,
        is_late: late,
        submitted_at: new Date().toISOString(),
      })
      .eq('player_id', user.id)
      .eq('race_id', raceId)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json(
        { error: 'Failed to update prediction' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      prediction: data,
    })
  } catch (error) {
    console.error('Prediction update error:', error)
    return NextResponse.json(
      { error: 'An error occurred while updating prediction' },
      { status: 500 }
    )
  }
}
