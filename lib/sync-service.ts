import { createClient } from '@supabase/supabase-js'
import { MotoGPAPI, MOTOGP_CATEGORY_ID, MotoGPEvent, MotoGPClassificationEntry } from './motogp-api'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export interface SyncRidersResult {
    total: number
    upserted: number
    deactivated: number
    source: 'classification' | 'season-api' | 'none'
    sourceDetail: string
}

export class SyncService {

    /**
     * Sync riders for a given year.
     *
     * Strategy (in order):
     * 1. Find the most recent FINISHED non-test event for the season.
     * 2. Find a FINISHED session (FP1 preferred, any FP otherwise) in that event.
     * 3. Fetch the classification for that session — this gives us the full rider
     *    list with accurate names, numbers, teams, and stable riders_api_uuid.
     * 4. Fall back to the season /riders endpoint if no classification is available
     *    (e.g. very start of season before any test has run).
     *
     * Riders present in the API but not in the current classification are marked
     * inactive (mid-season injuries / replacements). Riders in the classification
     * are always set to active=true.
     */
    static async syncRiders(year: number): Promise<SyncRidersResult> {
        console.log(`Syncing riders for year ${year}...`)
        const season = await this.getSeasonByYear(year)
        if (!season) throw new Error(`Season ${year} not found`)

        // Try to get riders from a finished session classification first
        const classificationResult = await this.getRidersFromClassification(season.id, year)

        if (classificationResult) {
            const { entries, sourceDetail, isTest } = classificationResult
            console.log(`Got ${entries.length} riders from classification (${sourceDetail})`)
            return await this.upsertRidersFromClassification(entries, sourceDetail)
        }

        // Fallback: season /riders endpoint (may return 400 early in season)
        console.log('No finished session found, falling back to season riders endpoint...')
        const riders = await MotoGPAPI.getRiders(season.id, MOTOGP_CATEGORY_ID)

        if (riders.length === 0) {
            console.log('Season riders endpoint returned no data')
            return { total: 0, upserted: 0, deactivated: 0, source: 'none', sourceDetail: 'No data available' }
        }

        console.log(`Got ${riders.length} riders from season endpoint`)
        let upserted = 0
        const activeExternalIds: string[] = []

        for (const rider of riders) {
            const fullName = `${rider.name} ${rider.surname}`
            const externalId = rider.id
            activeExternalIds.push(externalId)

            const { data: existing } = await supabase
                .from('riders')
                .select('id')
                .eq('external_id', externalId)
                .single()

            const riderData = {
                name: fullName,
                number: parseInt(rider.current_career_step.number),
                team: rider.current_career_step.team.name,
                active: true,
                external_id: externalId,
            }

            if (existing) {
                await supabase.from('riders').update(riderData).eq('id', existing.id)
            } else {
                await supabase.from('riders').insert(riderData)
            }
            upserted++
        }

        const deactivated = await this.deactivateRidersNotIn(activeExternalIds)

        return {
            total: riders.length,
            upserted,
            deactivated,
            source: 'season-api',
            sourceDetail: `Season ${year} riders endpoint`,
        }
    }

    /**
     * Find the most recently finished event and extract a classification from it.
     * Prefers race events; also accepts pre-season tests (has_race_data = false).
     * Returns null if no suitable finished session exists.
     */
    private static async getRidersFromClassification(
        seasonId: string,
        year: number
    ): Promise<{ entries: MotoGPClassificationEntry[]; sourceDetail: string; isTest: boolean } | null> {
        const events = await MotoGPAPI.getEvents(seasonId)

        // Sort: real events first (test=false), then tests; within each group most recent first
        const finishedEvents = events
            .filter(e => e.status === 'FINISHED' || e.status === 'CURRENT')
            .sort((a, b) => {
                // Prefer non-test events
                if (a.test !== b.test) return a.test ? 1 : -1
                // Then most recent
                return new Date(b.date_start).getTime() - new Date(a.date_start).getTime()
            })

        for (const event of finishedEvents) {
            try {
                const sessions = await MotoGPAPI.getSessions(event.id, MOTOGP_CATEGORY_ID)

                // Prefer FP1, then any finished FP, then any finished session
                const finishedSessions = sessions.filter(s => s.status === 'FINISHED')
                if (finishedSessions.length === 0) continue

                const fp1 = finishedSessions.find(s => s.type === 'FP' && s.number === 1)
                const anyFP = finishedSessions.find(s => s.type === 'FP')
                const session = fp1 ?? anyFP ?? finishedSessions[0]

                const data = await MotoGPAPI.getSessionClassification(session.id, year, event.test)

                if (data.classification && data.classification.length > 0) {
                    return {
                        entries: data.classification,
                        sourceDetail: `${event.name} — session ${session.type}${session.number ?? ''}`,
                        isTest: event.test,
                    }
                }
            } catch (err) {
                // This event/session didn't work, try the next one
                console.warn(`Could not get classification from event ${event.name}:`, err)
                continue
            }
        }

        return null
    }

    /**
     * Upsert riders from a classification entry list.
     * Uses riders_api_uuid as the stable external_id.
     * Marks riders NOT in this classification as inactive.
     */
    private static async upsertRidersFromClassification(
        entries: MotoGPClassificationEntry[],
        sourceDetail: string
    ): Promise<SyncRidersResult> {
        let upserted = 0
        const activeExternalIds: string[] = []

        for (const entry of entries) {
            const externalId = entry.rider.riders_api_uuid
            activeExternalIds.push(externalId)

            const riderData = {
                name: entry.rider.full_name,
                number: entry.rider.number,
                team: entry.team.name,
                active: true,
                external_id: externalId,
            }

            const { data: existing } = await supabase
                .from('riders')
                .select('id')
                .eq('external_id', externalId)
                .single()

            if (existing) {
                const { error } = await supabase.from('riders').update(riderData).eq('id', existing.id)
                if (error) {
                    console.error(`Failed to update rider ${entry.rider.full_name}:`, error)
                    continue
                }
            } else {
                // Also try matching by rider number in case the row exists without external_id
                const { data: byNumber } = await supabase
                    .from('riders')
                    .select('id')
                    .eq('number', entry.rider.number)
                    .is('external_id', null)
                    .single()

                if (byNumber) {
                    const { error } = await supabase.from('riders').update(riderData).eq('id', byNumber.id)
                    if (error) {
                        console.error(`Failed to update rider ${entry.rider.full_name} by number:`, error)
                        continue
                    }
                } else {
                    const { error } = await supabase.from('riders').insert(riderData)
                    if (error) {
                        console.error(`Failed to insert rider ${entry.rider.full_name}:`, error)
                        continue
                    }
                }
            }
            upserted++
        }

        const deactivated = await this.deactivateRidersNotIn(activeExternalIds)

        return {
            total: entries.length,
            upserted,
            deactivated,
            source: 'classification',
            sourceDetail,
        }
    }

    /**
     * Mark riders with known external_ids that are NOT in the provided list as inactive.
     * Riders without an external_id are left untouched (manually added entries).
     * Fetches all tracked riders first and filters in application code to avoid
     * fragile PostgREST UUID list syntax.
     */
    private static async deactivateRidersNotIn(activeExternalIds: string[]): Promise<number> {
        if (activeExternalIds.length === 0) return 0

        const activeSet = new Set(activeExternalIds)

        // Fetch all active riders that have an external_id (i.e. tracked via API)
        const { data: trackedRiders } = await supabase
            .from('riders')
            .select('id, name, external_id')
            .eq('active', true)
            .not('external_id', 'is', null)

        if (!trackedRiders || trackedRiders.length === 0) return 0

        const toDeactivate = trackedRiders.filter(r => !activeSet.has(r.external_id))

        for (const rider of toDeactivate) {
            console.log(`Marking ${rider.name} as inactive (not in current classification)`)
            await supabase.from('riders').update({ active: false }).eq('id', rider.id)
        }

        return toDeactivate.length
    }

    static async syncRaces(year: number) {
        console.log(`Syncing races for year ${year}...`)
        const season = await this.getSeasonByYear(year)
        if (!season) throw new Error(`Season ${year} not found`)

        const events = await MotoGPAPI.getEvents(season.id)
        console.log(`Found ${events.length} events`)

        // Filter to non-test events and assign round numbers by chronological order
        const raceEvents = events
            .filter(e => !e.test)
            .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())

        for (let i = 0; i < raceEvents.length; i++) {
            const event = raceEvents[i]
            const roundNumber = i + 1

            const raceDate = new Date(event.date_end)
            const sprintDate = new Date(raceDate)
            sprintDate.setDate(raceDate.getDate() - 1)

            // FP1 datetime: placeholder only — will be overwritten by syncSessionTimes()
            const fp1Date = new Date(event.date_start)
            fp1Date.setUTCHours(10, 45, 0, 0)

            const { data: existing } = await supabase
                .from('races')
                .select('id, status')
                .eq('external_id', event.id)
                .single()

            const raceData = {
                name: event.name,
                circuit: event.circuit.name,
                country: event.circuit.nation,
                race_date: raceDate.toISOString().split('T')[0],
                sprint_date: sprintDate.toISOString().split('T')[0],
                fp1_datetime: fp1Date.toISOString(),
                external_id: event.id,
                round_number: roundNumber,
            }

            if (existing) {
                // Don't overwrite status if already 'completed'
                const updateData = existing.status === 'completed'
                    ? raceData
                    : { ...raceData, status: eventStatusToRaceStatus(event.status) }
                await supabase.from('races').update(updateData).eq('id', existing.id)
            } else {
                await supabase.from('races').insert({
                    ...raceData,
                    status: eventStatusToRaceStatus(event.status),
                })
            }
        }
    }

    /**
     * Fetch exact FP1 datetimes from the sessions API and update the races table.
     * Should be called after syncRaces().
     */
    static async syncSessionTimes(year: number) {
        console.log(`Syncing FP1 session times for year ${year}...`)
        const season = await this.getSeasonByYear(year)
        if (!season) throw new Error(`Season ${year} not found`)

        const events = await MotoGPAPI.getEvents(season.id)
        const raceEvents = events.filter(e => !e.test)

        let updated = 0
        let failed = 0

        for (const event of raceEvents) {
            try {
                const sessions = await MotoGPAPI.getSessions(event.id, MOTOGP_CATEGORY_ID)
                const fp1 = sessions.find(s => s.type === 'FP' && s.number === 1)

                if (!fp1) {
                    console.warn(`No FP1 session found for ${event.name}`)
                    failed++
                    continue
                }

                const { error } = await supabase
                    .from('races')
                    .update({ fp1_datetime: fp1.date })
                    .eq('external_id', event.id)

                if (error) {
                    console.error(`Failed to update FP1 for ${event.name}:`, error)
                    failed++
                } else {
                    console.log(`Updated FP1 for ${event.name}: ${fp1.date}`)
                    updated++
                }
            } catch (err) {
                console.warn(`Could not fetch sessions for ${event.name}:`, err)
                failed++
            }
        }

        return { updated, failed }
    }

    private static async getSeasonByYear(year: number) {
        const seasons = await MotoGPAPI.getSeasons()
        return seasons.find(s => s.year === year)
    }
}

function eventStatusToRaceStatus(apiStatus: string): string {
    switch (apiStatus) {
        case 'FINISHED': return 'completed'
        case 'CURRENT': return 'in_progress'
        default: return 'upcoming'
    }
}
