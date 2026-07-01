import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import CollapsibleSection from '@/components/CollapsibleSection'
import CollapsibleRaceCard from '@/components/CollapsibleRaceCard'
import { calculatePositionPoints } from '@/lib/scoring'
import { PODIUM_TEXT, scoreIntensity, MAX_SLOT_SCORE, PENALTY_TEXT, EXACT_TEXT } from '@/lib/colors'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()

  // Fetch upcoming races
  const { data: upcomingRaces } = await supabase
    .from('races')
    .select('*')
    .eq('status', 'upcoming')
    .order('round_number', { ascending: true })

  // Fetch previous races
  const { data: previousRaces } = await supabase
    .from('races')
    .select('*')
    .neq('status', 'upcoming')
    .order('round_number', { ascending: true })

  // Fetch results for previous races
  const previousRaceIds = previousRaces?.map(r => r.id) || []
  const { data: raceResults } = await supabase
    .from('race_results')
    .select(`
      race_id,
      position,
      result_type,
      rider:riders (
        id,
        name,
        number,
        team
      )
    `)
    .in('race_id', previousRaceIds)
    .lte('position', 25)
    .order('position', { ascending: true })

  // Fetch Glorious 7 rider pools for previous races
  const { data: gloriousRiders } = previousRaceIds.length > 0
    ? await supabase
        .from('race_glorious_riders')
        .select('race_id, rider_id, display_order')
        .in('race_id', previousRaceIds)
        .order('display_order', { ascending: true })
    : { data: [] as { race_id: string; rider_id: string; display_order: number | null }[] }

  // Fetch player scores for previous races
  const { data: userScores } = previousRaceIds.length > 0
    ? await supabase
        .from('player_scores')
        .select('race_id, sprint_1st_points, sprint_2nd_points, sprint_3rd_points, race_1st_points, race_2nd_points, race_3rd_points, glorious_7_points, penalty_points, total_points')
        .eq('player_id', user.id)
        .in('race_id', previousRaceIds)
    : { data: [] as { race_id: string; sprint_1st_points: number; sprint_2nd_points: number; sprint_3rd_points: number; race_1st_points: number; race_2nd_points: number; race_3rd_points: number; glorious_7_points: number; penalty_points: number; total_points: number }[] }

  // Fetch user's predictions for upcoming races to check which ones are already done
  // AND for previous races to show the badges
  const upcomingRaceIds = upcomingRaces?.map(race => race.id) || []
  const allRaceIdsOfInterest = [...upcomingRaceIds, ...previousRaceIds]

  const { data: userPredictions } = await supabase
    .from('race_predictions')
    .select('*') // Select all fields needed for comparison
    .eq('player_id', user.id)
    .in('race_id', allRaceIdsOfInterest)

  // Create a Set of race IDs that have predictions for quick lookup (for upcoming races)
  const predictedRaceIds = new Set(userPredictions?.map(p => p.race_id) || [])

  // Fetch rider details for Next Up prediction display
  const nextRacePrediction = userPredictions?.find(p => p.race_id === upcomingRaces?.[0]?.id)
  const nextRacePredictedRiderIds = nextRacePrediction ? [
    nextRacePrediction.sprint_1st_id,
    nextRacePrediction.sprint_2nd_id,
    nextRacePrediction.sprint_3rd_id,
    nextRacePrediction.race_1st_id,
    nextRacePrediction.race_2nd_id,
    nextRacePrediction.race_3rd_id,
    nextRacePrediction.glorious_1st_id,
    nextRacePrediction.glorious_2nd_id,
    nextRacePrediction.glorious_3rd_id,
  ].filter(Boolean) as string[] : []

  const { data: nextRacePredictedRiders } = nextRacePredictedRiderIds.length > 0
    ? await supabase
        .from('riders')
        .select('id, name, number')
        .in('id', nextRacePredictedRiderIds)
    : { data: [] as { id: string; name: string; number: number }[] }

  // Build lookup map: rider_id -> rider (for next-race "Your Bets" display)
  const predictedRiderMap = Object.fromEntries(
    (nextRacePredictedRiders || []).map(r => [r.id, r])
  )

  // Collect all rider IDs predicted in previous races + all G7 pool rider IDs
  const previousPredictionRiderIds = [
    ...(userPredictions
      ?.filter(p => previousRaceIds.includes(p.race_id))
      .flatMap(p => [
        p.sprint_1st_id, p.sprint_2nd_id, p.sprint_3rd_id,
        p.race_1st_id, p.race_2nd_id, p.race_3rd_id,
        p.glorious_1st_id, p.glorious_2nd_id, p.glorious_3rd_id,
      ])
      .filter(Boolean) as string[]),
    ...((gloriousRiders || []).map(g => g.rider_id)),
  ]
  const uniquePreviousPredictionRiderIds = [...new Set(previousPredictionRiderIds)]

  const { data: previousPredictedRiders } = uniquePreviousPredictionRiderIds.length > 0
    ? await supabase
        .from('riders')
        .select('id, name, number')
        .in('id', uniquePreviousPredictionRiderIds)
    : { data: [] as { id: string; name: string; number: number }[] }

  const previousPredictedRiderMap = Object.fromEntries(
    (previousPredictedRiders || []).map(r => [r.id, r])
  )

  // Lookup: race_id -> player_scores row
  const userScoresMap = Object.fromEntries(
    (userScores || []).map(s => [s.race_id, s])
  )

  // Lookup: race_id -> Set of glorious rider_ids
  const gloriousRidersByRace = (gloriousRiders || []).reduce<Record<string, Set<string>>>(
    (acc, row) => {
      if (!acc[row.race_id]) acc[row.race_id] = new Set()
      acc[row.race_id].add(row.rider_id)
      return acc
    },
    {}
  )

  // Fetch championship prediction status with rider details
  const { data: championshipPrediction } = await supabase
    .from('championship_predictions')
    .select(`
      *,
      first_place:riders!championship_predictions_first_place_id_fkey(name, number, team, external_id),
      second_place:riders!championship_predictions_second_place_id_fkey(name, number, team, external_id),
      third_place:riders!championship_predictions_third_place_id_fkey(name, number, team, external_id)
    `)
    .eq('player_id', user.id)
    .eq('season_year', 2026)
    .single()

  // Fetch first race for deadline
  const { data: firstRace } = await supabase
    .from('races')
    .select('fp1_datetime')
    .order('round_number', { ascending: true })
    .limit(1)
    .single()

  const championshipDeadline = new Date(firstRace?.fp1_datetime || '2026-03-01T00:00:00Z')
  const championshipDeadlinePassed = championshipDeadline < new Date()

  // First-time login experience: Redirect to championship prediction if not done
  // (Ensures 100% participation in season predictions)
  if (!championshipPrediction && !championshipDeadlinePassed) {
    redirect('/championship?welcome=true')
  }

  const FP1_DURATION_MS = 45 * 60 * 1000
  const fp1Start = upcomingRaces?.[0]?.fp1_datetime ? new Date(upcomingRaces[0].fp1_datetime) : null
  const fp1End = fp1Start ? new Date(fp1Start.getTime() + FP1_DURATION_MS) : null
  const now = new Date()
  const isInPenaltyWindow = fp1Start != null && fp1End != null && now >= fp1Start && now < fp1End
  const isHardLocked = fp1End != null && now >= fp1End

  const nextRacePred = userPredictions?.find(p => p.race_id === upcomingRaces?.[0]?.id)
  const nextRaceG7Missing = nextRacePred != null && (
    !nextRacePred.glorious_1st_id || !nextRacePred.glorious_2nd_id || !nextRacePred.glorious_3rd_id
  )

  return (
    <main className="min-h-screen p-6 text-white font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex justify-between items-end border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-display font-black italic uppercase text-white transform -skew-x-12">
              Dashboard
            </h1>
            <p className="text-gray-400 mt-2 font-medium tracking-wide">
              Welcome, <span className="text-motogp-red font-bold">{user.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/leaderboard"
              className="px-4 py-2 text-sm font-bold uppercase tracking-wider border border-gray-700 hover:border-motogp-red hover:text-motogp-red rounded-lg transition-colors"
            >
              🏆 Leaderboard
            </Link>
            <LogoutButton />
          </div>
        </div>

        {/* Championship Prediction Display - After deadline or submitted */}
        {championshipPrediction && (
          <div className={championshipDeadlinePassed ? 'mb-6' : 'mb-12'}>
            <h2 className="text-2xl font-display font-bold italic uppercase mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-motogp-red skew-x-12 inline-block"></span>
              Your Championship Prediction
            </h2>
            <div className={`${championshipDeadlinePassed ? 'px-4 py-3' : 'p-6'} bg-track-gray rounded-xl border border-gray-800 relative overflow-hidden`}>
              {championshipDeadlinePassed ? (
                /* Compact locked view — single row */
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="flex items-center gap-1.5 text-xs text-blue-400 font-bold uppercase tracking-wider shrink-0">
                    🔒 Locked
                  </span>
                  <span className="text-gray-700 hidden sm:inline">|</span>
                  {([
                    { place: championshipPrediction.first_place, medal: '🥇', nameClass: 'text-white' },
                    { place: championshipPrediction.second_place, medal: '🥈', nameClass: 'text-gray-300' },
                    { place: championshipPrediction.third_place, medal: '🥉', nameClass: 'text-gray-400' },
                  ] as const).map(({ place, medal, nameClass }, i) => (
                    <span key={medal} className="flex items-center gap-2 text-sm">
                      {i > 0 && <span className="text-gray-700 hidden sm:inline mr-2">·</span>}
                      <span>{medal}</span>
                      <span className={`font-display font-black italic uppercase ${nameClass}`}>{(place as any)?.name}</span>
                      <span className="font-mono text-gray-500 text-xs">#{(place as any)?.number}</span>
                    </span>
                  ))}
                </div>
              ) : (
                /* Full grid view — before deadline */
                <div className="space-y-4 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 1st Place */}
                    <div className="p-4 bg-gradient-to-br from-gray-900 to-black border border-yellow-500/30 rounded-lg relative overflow-hidden">
                      <div className="absolute top-2 right-2 text-4xl opacity-20">🥇</div>
                      <div className="text-xs text-yellow-500 font-bold uppercase tracking-wider mb-1">Winner</div>
                      <div className="text-xl font-display font-black italic uppercase">{championshipPrediction.first_place?.name}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span className="font-mono text-white">#{championshipPrediction.first_place?.number}</span>
                        <span>{championshipPrediction.first_place?.team}</span>
                      </div>
                    </div>
                    {/* 2nd Place */}
                    <div className="p-4 bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-lg relative overflow-hidden">
                      <div className="absolute top-2 right-2 text-4xl opacity-20">🥈</div>
                      <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Runner Up</div>
                      <div className="text-xl font-display font-black italic uppercase">{championshipPrediction.second_place?.name}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span className="font-mono text-white">#{championshipPrediction.second_place?.number}</span>
                        <span>{championshipPrediction.second_place?.team}</span>
                      </div>
                    </div>
                    {/* 3rd Place */}
                    <div className="p-4 bg-gradient-to-br from-gray-900 to-black border border-orange-700/30 rounded-lg relative overflow-hidden">
                      <div className="absolute top-2 right-2 text-4xl opacity-20">🥉</div>
                      <div className="text-xs text-orange-500 font-bold uppercase tracking-wider mb-1">Third</div>
                      <div className="text-xl font-display font-black italic uppercase">{championshipPrediction.third_place?.name}</div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span className="font-mono text-white">#{championshipPrediction.third_place?.number}</span>
                        <span>{championshipPrediction.third_place?.team}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-800 text-right">
                    <Link
                      href="/championship"
                      className="text-motogp-red hover:text-white font-bold uppercase text-sm tracking-wider transition-colors"
                    >
                      Update prediction →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Predict - Next Race */}
        {upcomingRaces && upcomingRaces.length > 0 && (
          <div className="mb-10 p-6 md:p-8 bg-gradient-to-r from-gray-900 via-gray-900 to-gray-800 rounded-2xl border border-gray-700 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
              <span className="text-[10rem] leading-none select-none">🏁</span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-motogp-red/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="w-full md:flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-motogp-red opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-motogp-red"></span>
                  </span>
                  <span className="text-motogp-red font-bold uppercase tracking-widest text-xs">Next Up</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-display font-black italic uppercase text-white mb-2 leading-none">
                  {upcomingRaces[0].name}
                </h2>
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-gray-300 font-medium text-lg">
                  <span className="flex items-center gap-2"><span className="text-gray-500">📍</span> {upcomingRaces[0].circuit}</span>
                  <span className="hidden md:inline text-gray-700">•</span>
                  <span className="flex items-center gap-2"><span className="text-gray-500">📅</span> {new Date(upcomingRaces[0].race_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-black/30 rounded border border-gray-700/50 text-sm text-gray-400 font-mono">
                  <span>⏰ Deadline:</span>
                  <span className="text-white">{new Date(upcomingRaces[0].fp1_datetime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {nextRacePrediction && nextRacePredictedRiders && nextRacePredictedRiders.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-gray-700/50">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">Your Bets</div>
                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                      {([
                        { label: 'Sprint', prefix: 'sprint' },
                        { label: 'Race', prefix: 'race' },
                        { label: 'Glorious 7', prefix: 'glorious' },
                      ] as const).map(({ label, prefix }) => {
                        const ids = [
                          nextRacePrediction[`${prefix}_1st_id` as keyof typeof nextRacePrediction] as string,
                          nextRacePrediction[`${prefix}_2nd_id` as keyof typeof nextRacePrediction] as string,
                          nextRacePrediction[`${prefix}_3rd_id` as keyof typeof nextRacePrediction] as string,
                        ]
                        const riders = ids.map(id => predictedRiderMap[id]).filter(Boolean)
                        return (
                          <div key={prefix} className="bg-black/30 rounded-lg border border-gray-800 p-3 md:p-4">
                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">{label}</div>
                            {riders.length === 0 ? (
                              <div className="text-xs text-gray-700 italic">—</div>
                            ) : (
                              <div className="space-y-2">
                                {riders.map((rider: any, i: number) => {
                                  const medals = ['🥇', '🥈', '🥉']
                                  return (
                                    <div key={rider.id} className="flex items-center gap-2">
                                      <span className="text-sm leading-none">{medals[i]}</span>
                                      <div className="min-w-0">
                                        <div className="text-xs font-sans font-semibold uppercase text-white leading-tight truncate pr-0.5">
                                          {rider.name.split(' ').pop()}
                                        </div>
                                        <div className="text-[10px] font-mono text-gray-600">#{rider.number}</div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {isHardLocked ? (
                <div className="w-full md:w-auto px-8 py-5 bg-gray-800 border-2 border-gray-700 text-gray-500 font-black uppercase italic tracking-wider rounded-xl transform -skew-x-6 cursor-not-allowed select-none text-center">
                  <span className="inline-block skew-x-6 text-xl">🔒 Locked</span>
                </div>
              ) : isInPenaltyWindow ? (
                <Link
                  href={`/predict/${upcomingRaces[0].id}`}
                  className="w-full md:w-auto px-8 py-5 bg-amber-500/10 border-2 border-amber-500 hover:bg-amber-500/20 text-amber-400 font-black uppercase italic tracking-wider rounded-xl transform -skew-x-6 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.3)] group-hover:scale-[1.02] text-center"
                >
                  <span className="inline-block skew-x-6 text-xl">⚠ Late — Penalty Applies</span>
                </Link>
              ) : predictedRaceIds.has(upcomingRaces[0].id) && nextRaceG7Missing ? (
                <Link
                  href={`/predict/${upcomingRaces[0].id}`}
                  className="w-full md:w-auto px-8 py-5 bg-amber-500/10 border-2 border-amber-500 hover:bg-amber-500/20 text-amber-400 font-black uppercase italic tracking-wider rounded-xl transform -skew-x-6 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.3)] group-hover:scale-[1.02] text-center"
                >
                  <span className="inline-block skew-x-6 text-xl">⚠ Add G7 Picks</span>
                </Link>
              ) : predictedRaceIds.has(upcomingRaces[0].id) ? (
                <Link
                  href={`/predict/${upcomingRaces[0].id}`}
                  className="w-full md:w-auto px-8 py-5 bg-green-900/20 border-2 border-green-500 hover:bg-green-600 hover:border-green-600 text-green-500 hover:text-white font-black uppercase italic tracking-wider rounded-xl transform -skew-x-6 transition-all shadow-[0_0_20px_rgba(34,197,94,0.1)] hover:shadow-[0_0_40px_rgba(34,197,94,0.4)] group-hover:scale-[1.02] text-center"
                >
                  <span className="inline-block skew-x-6 text-xl">✓ Edit Prediction</span>
                </Link>
              ) : (
                <Link
                  href={`/predict/${upcomingRaces[0].id}`}
                  className="w-full md:w-auto px-8 py-5 bg-motogp-red border-2 border-motogp-red hover:bg-white hover:text-black hover:border-white text-white font-black uppercase italic tracking-wider rounded-xl transform -skew-x-6 transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] group-hover:scale-[1.02] text-center"
                >
                  <span className="inline-block skew-x-6 text-xl">Predict Now</span>
                </Link>
              )}
            </div>
          </div>
        )}

          {/* Championship Prediction CTA - Before deadline, not submitted */}
          {!championshipDeadlinePassed && !championshipPrediction && (
            <div className="mb-12">
              <Link
                href="/championship"
                className="block p-6 bg-gradient-to-br from-yellow-600 to-yellow-700 text-white rounded-xl border-2 border-yellow-500 hover:border-yellow-400 transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)]"
              >
                <h3 className="text-lg font-display font-black italic uppercase mb-2">
                  🏆 Predict Champion
                </h3>
                <p className="text-xs font-bold uppercase opacity-90">
                  Deadline: {championshipDeadline.toLocaleDateString()}
                </p>
              </Link>
            </div>
          )}



        {/* Previous Races Section */}
        <CollapsibleSection
          title="Previous Races"
          count={previousRaces?.length ?? 0}
        >
          {previousRaces && previousRaces.length > 0 ? (
            <div className="space-y-4">
              {previousRaces.map((race) => {
                const raceSpecificResults = raceResults?.filter((r) => r.race_id === race.id) || []
                const prediction = userPredictions?.find(p => p.race_id === race.id)
                const scoreRow = userScoresMap[race.id]
                const gloriousPool = gloriousRidersByRace[race.id] || new Set<string>()

                const sprintResults = raceSpecificResults
                  .filter(r => r.result_type === 'sprint')
                  .sort((a, b) => a.position - b.position)
                const raceFullResults = raceSpecificResults
                  .filter(r => r.result_type === 'race')
                  .sort((a, b) => a.position - b.position)
                const gloriousRiderOrder = (gloriousRiders || [])
                  .filter(g => g.race_id === race.id)
                  .sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99))
                  .map(g => g.rider_id)

                const gloriousResultsRaw = gloriousRiderOrder.map((riderId, poolIdx) => {
                  const result = raceFullResults.find((r: any) => r.rider?.id === riderId)
                  return {
                    riderId,
                    rider: result?.rider ?? null,
                    position: result?.position ?? null,
                    relativePos: null as number | null,
                    poolIdx,
                  }
                })
                gloriousResultsRaw.sort((a, b) => {
                  if (a.position === null && b.position === null) return a.poolIdx - b.poolIdx
                  if (a.position === null) return 1
                  if (b.position === null) return -1
                  return a.position - b.position
                })
                gloriousResultsRaw.forEach((r, i) => { r.relativePos = i + 1 })
                const gloriousResults = gloriousResultsRaw

                const medals = ['🥇', '🥈', '🥉']
                const getPredRider = (id: string | null | undefined) =>
                  id ? previousPredictedRiderMap[id] : null
                const surname = (name: string) => {
                  const parts = name.trim().split(' ')
                  return parts.length > 1 ? parts.slice(1).join(' ') : parts[0]
                }
                // Rank carries the color (gold/silver/bronze); everything else stays neutral.
                const posColor = (pos: number) =>
                  pos >= 1 && pos <= 3 ? PODIUM_TEXT[pos - 1] : 'text-gray-600'

                // Exact predictions get a subtle amber row tint; otherwise a single neutral background.
                const rowBg = (diff: number | null) =>
                  diff === 0 ? 'bg-amber-400/5 border-amber-400/20' : 'bg-gray-900/20 border-gray-800/30'

                // Compute per-position G7 points by recalculating from gloriousResults
                const calcG7Pts = (riderId: string | null | undefined, slot: number): number => {
                  if (!riderId) return 0
                  const res = gloriousResults.find(r => r.riderId === riderId)
                  if (!res || res.relativePos === null) return 0
                  return calculatePositionPoints(res.relativePos, slot, 'winner')
                }

                const g7Pts = [
                  calcG7Pts((prediction as any)?.glorious_1st_id, 1),
                  calcG7Pts((prediction as any)?.glorious_2nd_id, 2),
                  calcG7Pts((prediction as any)?.glorious_3rd_id, 3),
                ]

                const panels = [
                  {
                    label: 'Sprint',
                    bets: [
                      { riderId: (prediction as any)?.sprint_1st_id, pts: scoreRow?.sprint_1st_points ?? 0 },
                      { riderId: (prediction as any)?.sprint_2nd_id, pts: scoreRow?.sprint_2nd_points ?? 0 },
                      { riderId: (prediction as any)?.sprint_3rd_id, pts: scoreRow?.sprint_3rd_points ?? 0 },
                    ],
                    results: sprintResults.slice(0, 5),
                    predictedIds: new Set([(prediction as any)?.sprint_1st_id, (prediction as any)?.sprint_2nd_id, (prediction as any)?.sprint_3rd_id].filter(Boolean)),
                    isGlorious: false,
                    panelTotal: (scoreRow?.sprint_1st_points ?? 0) + (scoreRow?.sprint_2nd_points ?? 0) + (scoreRow?.sprint_3rd_points ?? 0),
                  },
                  {
                    label: 'Race',
                    bets: [
                      { riderId: (prediction as any)?.race_1st_id, pts: scoreRow?.race_1st_points ?? 0 },
                      { riderId: (prediction as any)?.race_2nd_id, pts: scoreRow?.race_2nd_points ?? 0 },
                      { riderId: (prediction as any)?.race_3rd_id, pts: scoreRow?.race_3rd_points ?? 0 },
                    ],
                    results: raceFullResults.slice(0, 5),
                    predictedIds: new Set([(prediction as any)?.race_1st_id, (prediction as any)?.race_2nd_id, (prediction as any)?.race_3rd_id].filter(Boolean)),
                    isGlorious: false,
                    panelTotal: (scoreRow?.race_1st_points ?? 0) + (scoreRow?.race_2nd_points ?? 0) + (scoreRow?.race_3rd_points ?? 0),
                  },
                  {
                    label: 'Glorious 7',
                    bets: [
                      { riderId: (prediction as any)?.glorious_1st_id, pts: g7Pts[0] },
                      { riderId: (prediction as any)?.glorious_2nd_id, pts: g7Pts[1] },
                      { riderId: (prediction as any)?.glorious_3rd_id, pts: g7Pts[2] },
                    ],
                    results: gloriousResults,
                    predictedIds: new Set([(prediction as any)?.glorious_1st_id, (prediction as any)?.glorious_2nd_id, (prediction as any)?.glorious_3rd_id].filter(Boolean)),
                    isGlorious: true,
                    panelTotal: scoreRow?.glorious_7_points ?? 0,
                  },
                ]

                const hasAnyData = sprintResults.length > 0 || raceFullResults.length > 0 || gloriousResults.length > 0

                const cardHeader = (
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="bg-gray-800 text-gray-500 text-xs font-bold uppercase px-2 py-0.5 rounded">
                          Round {race.round_number}
                        </span>
                      </div>
                      <h3 className="text-2xl font-display font-black italic uppercase text-gray-300 group-hover:text-motogp-red transition-colors duration-300">
                        {race.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2 font-medium">
                        {race.circuit} • {race.country}
                      </p>
                      <div className="flex gap-4 text-sm text-gray-600 mt-2">
                        <div>
                          <span className="text-gray-500 font-bold">RACE:</span>{' '}
                          {new Date(race.race_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="w-full md:w-auto px-6 py-3 border border-gray-700 text-gray-500 font-black uppercase italic tracking-wider rounded transform -skew-x-12 text-center cursor-default">
                      <span className="inline-block skew-x-12">Completed</span>
                    </div>
                  </div>
                )

                return (
                  <CollapsibleRaceCard key={race.id} header={cardHeader}>

                    {/* Results Display — 3 panels */}
                    {hasAnyData && (
                      <div className="mt-6 pt-6 border-t border-gray-700/50 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {panels.map((panel) => (
                          <div key={panel.label} className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-motogp-red flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-motogp-red shrink-0"></span>
                              {panel.label}
                            </h4>

                            {/* Your Bets */}
                            <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-3">
                              <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Your Bets</div>
                              {!prediction ? (
                                <div className="text-xs text-gray-700 italic py-1">No prediction</div>
                              ) : (
                                <div className="space-y-1.5">
                                  {panel.bets.map((bet, i) => {
                                    const rider = getPredRider(bet.riderId)
                                    // Determine accuracy diff: find rider's actual finish position
                                    let diff: number | null = null
                                    if (rider && panel.results.length > 0) {
                                      const actual = panel.results.find((r: any) => {
                                        const rid = panel.isGlorious ? r.riderId : r.rider?.id
                                        return rid === bet.riderId
                                      })
                                      if (actual) {
                                        const a = actual as any
                                        const actualPos = panel.isGlorious ? a.relativePos : a.position
                                        if (actualPos != null) diff = Math.abs(actualPos - (i + 1))
                                      }
                                    }
                                    const isExact = rider && panel.results.length > 0 && diff === 0
                                    return (
                                      <div key={i} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span className="text-sm leading-none shrink-0">{medals[i]}</span>
                                          {rider ? (
                                            <>
                                              <span className="font-sans font-semibold uppercase truncate pr-0.5 text-gray-200">
                                                {surname(rider.name)}
                                              </span>
                                              {isExact && <span className={`shrink-0 ${EXACT_TEXT}`}>✓</span>}
                                              <span className="font-mono text-gray-600 shrink-0">#{rider.number}</span>
                                            </>
                                          ) : (
                                            <span className="text-gray-700">—</span>
                                          )}
                                        </div>
                                        <span className={`font-mono font-bold shrink-0 ml-2 ${bet.pts > 0 ? scoreIntensity(bet.pts, MAX_SLOT_SCORE) : 'text-gray-600'}`}>
                                          {bet.pts > 0 ? `+${bet.pts}` : rider ? '0' : ''}
                                        </span>
                                      </div>
                                    )
                                  })}
                                  {scoreRow && (
                                    <div className="pt-1.5 mt-1.5 border-t border-gray-800 flex items-center justify-between">
                                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">Total</span>
                                      <span className={`font-mono font-bold text-xs ${panel.panelTotal > 0 ? scoreIntensity(panel.panelTotal, MAX_SLOT_SCORE * 3) : 'text-gray-600'}`}>
                                        {panel.panelTotal > 0 ? `+${panel.panelTotal}` : panel.panelTotal}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Results */}
                            {panel.results.length > 0 && (
                              <div className="space-y-1">
                                <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-1.5">
                                  {panel.isGlorious ? 'G7 Ranked (all 7)' : 'Results'}
                                </div>
                                {panel.results.map((result: any) => {
                                  const displayPos = panel.isGlorious ? result.relativePos : result.position
                                  const matchedRiderId = panel.isGlorious ? result.riderId : result.rider?.id
                                  const predictedSlot = matchedRiderId
                                    ? [...panel.predictedIds].indexOf(matchedRiderId) + 1
                                    : -1
                                  // predictedSlot > 0 means this rider was predicted; diff = |displayPos - predictedSlot|
                                  const resultDiff = predictedSlot > 0 ? Math.abs(displayPos - predictedSlot) : null
                                  const hasDnf = panel.isGlorious && result.position === null
                                  return (
                                    <div
                                      key={result.riderId ?? displayPos}
                                      className={`flex items-center justify-between text-xs px-2 py-1 rounded border ${rowBg(resultDiff)}`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className={`font-mono font-bold w-4 text-center shrink-0 ${posColor(displayPos)}`}>
                                          {displayPos}
                                        </span>
                                        <span className="font-sans font-semibold uppercase truncate pr-0.5 text-gray-300">
                                          {(() => {
                                            const r = result.rider ?? previousPredictedRiderMap[result.riderId]
                                            return r ? surname(r.name) : '?'
                                          })()}
                                        </span>
                                        {resultDiff === 0 && <span className={`shrink-0 ${EXACT_TEXT}`}>✓</span>}
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0 ml-2">
                                        {panel.isGlorious && (
                                          hasDnf
                                            ? <span className={`text-[10px] ${PENALTY_TEXT} font-mono font-bold`}>DNF</span>
                                            : <span className="text-[10px] text-gray-600 font-mono">P{result.position}</span>
                                        )}
                                        <span className="text-[10px] text-gray-700 font-mono">
                                          #{(result.rider ?? previousPredictedRiderMap[result.riderId])?.number ?? '?'}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Weekend total */}
                    {scoreRow && (
                      <div className="mt-4 pt-4 border-t border-gray-800/50 flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Weekend Total</span>
                        <div className="flex items-center gap-3">
                          {scoreRow.penalty_points > 0 && (
                            <span className={`text-xs ${PENALTY_TEXT} font-mono`}>-{scoreRow.penalty_points} penalty</span>
                          )}
                          <span className={`text-lg font-display font-black italic ${scoreRow.total_points > 0 ? 'text-white' : 'text-gray-600'}`}>
                            {scoreRow.total_points > 0 ? `+${scoreRow.total_points}` : scoreRow.total_points} pts
                          </span>
                        </div>
                      </div>
                    )}
                  </CollapsibleRaceCard>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 italic">
              No previous races.
            </p>
          )}
        </CollapsibleSection>

        <div>
          <h2 className="text-3xl font-display font-black italic uppercase mb-6 flex items-center gap-2">
            <span className="w-1 h-8 bg-motogp-red skew-x-12 inline-block"></span>
            Upcoming Races
          </h2>
          {upcomingRaces && upcomingRaces.length > 0 ? (
            <div className="space-y-4">
              {upcomingRaces.map((race) => (
                <Link
                  key={race.id}
                  href={`/predict/${race.id}`}
                  className="group block relative p-6 bg-track-gray rounded-xl border border-gray-800 hover:border-gray-600 transition-all duration-200 overflow-hidden"
                >
                  {/* Decorative round number */}
                  <div className="absolute top-0 right-4 font-display font-black italic text-[6rem] leading-none text-white opacity-[0.04] select-none pointer-events-none group-hover:opacity-[0.07] transition-opacity">
                    {race.round_number}
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-3xl font-display font-black italic uppercase text-white mb-1 group-hover:text-motogp-red transition-colors">
                      {race.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-2 font-medium">
                      {race.circuit} • {race.country}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
                      <div>
                        <span className="text-motogp-red font-bold">RACE:</span> {new Date(race.race_date).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="text-motogp-red font-bold">DEADLINE:</span> {new Date(race.fp1_datetime).toLocaleString()}
                      </div>
                    </div>
                    {predictedRaceIds.has(race.id) && (() => {
                      const pred = userPredictions?.find(p => p.race_id === race.id)
                      const g7Missing = pred && (!pred.glorious_1st_id || !pred.glorious_2nd_id || !pred.glorious_3rd_id)
                      return g7Missing ? (
                        <div className="mt-3 text-xs text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <span>⚠</span> Sprint &amp; Race saved — G7 picks missing
                        </div>
                      ) : (
                        <div className="mt-3 text-xs text-green-500 font-bold uppercase tracking-wider">✓ Full prediction submitted</div>
                      )
                    })()}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">
              No upcoming races at the moment.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
