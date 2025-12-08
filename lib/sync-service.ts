import { createClient } from '@supabase/supabase-js'
import { MotoGPAPI, MOTOGP_CATEGORY_ID, MotoGPEvent, MotoGPRider } from './motogp-api'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export class SyncService {

    static async syncRiders(year: number) {
        console.log(`Syncing riders for year ${year}...`);
        const season = await this.getSeasonByYear(year);
        if (!season) throw new Error(`Season ${year} not found`);

        const riders = await MotoGPAPI.getRiders(season.id, MOTOGP_CATEGORY_ID);
        console.log(`Found ${riders.length} riders`);

        for (const rider of riders) {
            // Map to DB structure
            // name: "Name Surname" or just "Surname"? Schema has 'name VARCHAR(100)'.
            // Let's use "Name Surname".
            const fullName = `${rider.name} ${rider.surname}`;

            // Check if exists by external_id
            const { data: existing } = await supabase
                .from('riders')
                .select('id')
                .eq('external_id', rider.id)
                .single();

            const riderData = {
                name: fullName,
                number: parseInt(rider.current_career_step.number),
                team: rider.current_career_step.team.name,
                active: true,
                external_id: rider.id
            };

            if (existing) {
                await supabase.from('riders').update(riderData).eq('id', existing.id);
            } else {
                await supabase.from('riders').insert(riderData);
            }
        }
    }

    static async syncRaces(year: number) {
        console.log(`Syncing races for year ${year}...`);
        const season = await this.getSeasonByYear(year);
        if (!season) throw new Error(`Season ${year} not found`);

        const events = await MotoGPAPI.getEvents(season.id);
        console.log(`Found ${events.length} events`);

        for (const event of events) {
            if (event.test) continue; // Skip test events

            // Determine dates
            // event.date_start (e.g. "2024-03-08T00:00:00+03:00" assuming ISO)
            // event.date_end (Sunday usually)

            const raceDate = new Date(event.date_end);
            const sprintDate = new Date(raceDate);
            sprintDate.setDate(raceDate.getDate() - 1); // Sprint is day before Race

            // For FP1, we ideally need session info. 
            // For now, let's estimate FP1 as Friday 10:45 AM local time? 
            // Or just use date_start + 10 hours.
            // This is a rough estimation. To get exact, we need session schedule.
            // We'll update this later if we fetch sessions.
            const fp1Date = new Date(event.date_start);
            fp1Date.setHours(10, 45, 0, 0); // Defaulting to 10:45 AM of start date

            // Check availability
            const { data: existing } = await supabase
                .from('races')
                .select('id')
                .eq('external_id', event.id)
                .single();

            // Round number? API might not give it directly in the list, but list order is usually chronological.
            // We might need to rely on existing data or increment.
            // Let's assume the order in 'events' array is the round order.
            // But removing tests might mess up count if we just use index.
            // We really should check if the API gives round info.
            // Assuming round info is NOT in the basic event object based on interface, 
            // we'll leave round_number as is if updating, or guess if inserting.

            const raceData = {
                name: event.name,
                circuit: event.circuit.name,
                country: event.circuit.nation,
                race_date: raceDate.toISOString().split('T')[0], // YYYY-MM-DD
                sprint_date: sprintDate.toISOString().split('T')[0],
                fp1_datetime: fp1Date.toISOString(),
                // status: Calculate based on date? keep existing if 'completed'
                external_id: event.id
            };

            if (existing) {
                await supabase.from('races').update(raceData).eq('id', existing.id);
            } else {
                // New race
                await supabase.from('races').insert({
                    ...raceData,
                    round_number: 0, // Placeholder, needs manual fix or better logic
                    status: 'upcoming'
                });
            }
        }
    }

    private static async getSeasonByYear(year: number) {
        const seasons = await MotoGPAPI.getSeasons();
        return seasons.find(s => s.year === year);
    }
}
