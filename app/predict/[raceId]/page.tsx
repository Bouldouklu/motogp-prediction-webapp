import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PredictionForm from '@/components/PredictionForm'
import Link from 'next/link'

export default async function PredictPage({
  params,
}: {
  params: Promise<{ raceId: string }>
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const { raceId } = await params
  const supabase = await createClient()

  // Fetch race details
  const { data: race } = await supabase
    .from('races')
    .select('*')
    .eq('id', raceId)
    .single()

  if (!race) {
    return (
      <main className="min-h-screen p-6 font-sans text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-display font-black italic uppercase mb-4">Race not found</h1>
          <Link href="/dashboard" className="text-motogp-red hover:text-white font-bold uppercase">
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    )
  }

  // Fetch active riders
  const { data: riders } = await supabase
    .from('riders')
    .select('*')
    .eq('active', true)
    .select('*')
    .eq('active', true)
    .order('number', { ascending: true })

  // Fetch Glorious 7 riders
  const { data: gloriousData } = await supabase
    .from('race_glorious_riders')
    .select('rider_id, riders(*)')
    .eq('race_id', raceId)
    .order('display_order', { ascending: true })

  // Transform to Rider[]
  // @ts-ignore - Supabase type inference for joins can be tricky
  const gloriousRiders = gloriousData?.map(d => d.riders).filter(Boolean) as Rider[] || []

  // Check for existing prediction
  const { data: existingPrediction } = await supabase
    .from('race_predictions')
    .select('*')
    .eq('player_id', user.id)
    .eq('race_id', raceId)
    .single()

  return (
    <main className="min-h-screen p-4 md:p-8 font-sans text-white">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-white transition-colors mb-4 inline-block"
          >
            ← Back to Pit Lane
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-4 border-motogp-red pb-6 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-white text-black text-xs font-bold uppercase px-2 py-1 rounded -skew-x-12">
                  Round {race.round_number}
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-display font-black italic tracking-tighter uppercase transform -skew-x-12 leading-none">
                {race.name}
              </h1>
              <p className="text-xl text-gray-400 mt-2 font-display font-bold tracking-widest uppercase pl-2">
                {race.circuit}, {race.country}
              </p>
            </div>
            <div className="text-right hidden md:block">
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Sprint</div>
              <div className="text-lg font-mono font-bold text-gray-300 mb-2">{new Date(race.sprint_date).toLocaleDateString()}</div>
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Race</div>
              <div className="text-xl font-mono font-bold text-white">{new Date(race.race_date).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        <div className="bg-track-gray rounded-xl border border-gray-800 p-6 md:p-8 shadow-2xl relative overflow-hidden">
          {/* Decorative BG */}
          <div className="absolute -top-10 -right-10 text-[10rem] opacity-5 font-display font-black italic text-motogp-red pointer-events-none select-none">
            PREDICT
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl font-display font-black italic uppercase mb-8 flex items-center gap-2">
              <span className="w-1 h-8 bg-motogp-red skew-x-12 inline-block"></span>
              {existingPrediction
                ? 'Update Your Strategy'
                : 'Enter Your Strategy'}
            </h2>

            {riders && riders.length > 0 ? (
              <PredictionForm
                raceId={raceId}
                raceName={race.name}
                riders={riders}
                gloriousRiders={gloriousRiders}
                existingPrediction={existingPrediction}
                deadlineAt={race.fp1_datetime}
              />
            ) : (
              <p className="text-gray-400 italic">
                No riders available for selection.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
