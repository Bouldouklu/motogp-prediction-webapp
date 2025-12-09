
import { createClient } from '@supabase/supabase-js'
import path from 'path'
import fs from 'fs'

// Simple env parser
function parseEnv(content: string) {
    const res: Record<string, string> = {}
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
            const key = match[1].trim()
            let value = match[2].trim()
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
            res[key] = value
        }
    })
    return res
}

// Load environment variables from .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envLocalPath)) {
    const envConfig = parseEnv(fs.readFileSync(envLocalPath, 'utf-8'))
    console.log('Loaded keys from .env.local:', Object.keys(envConfig))
    for (const k in envConfig) {
        process.env[k] = envConfig[k]
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY

if (!supabaseUrl) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL')
    process.exit(1)
}
if (!supabaseServiceKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY or SERVICE_ROLE_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey!)

const RIDERS = [
    { name: 'Johann Zarco', number: 5, team: 'Honda LCR', active: true },
    { name: 'Toprak Razgatlıoğlu', number: 7, team: 'Yamaha Pramac', active: true },
    { name: 'Luca Marini', number: 10, team: 'Honda HRC Castrol', active: true },
    { name: 'Diogo Moreira', number: 11, team: 'Honda LCR', active: true },
    { name: 'Maverick Viñales', number: 12, team: 'KTM Tech3', active: true },
    { name: 'Fabio Quartararo', number: 20, team: 'Yamaha', active: true },
    { name: 'Franco Morbidelli', number: 21, team: 'Ducati VR46', active: true },
    { name: 'Enea Bastianini', number: 23, team: 'KTM Tech3', active: true },
    { name: 'Raúl Fernández', number: 25, team: 'Aprilia Trackhouse', active: true },
    { name: 'Brad Binder', number: 33, team: 'KTM', active: true },
    { name: 'Joan Mir', number: 36, team: 'Honda HRC Castrol', active: true },
    { name: 'Pedro Acosta', number: 37, team: 'KTM', active: true },
    { name: 'Álex Rins', number: 42, team: 'Yamaha', active: true },
    { name: 'Jack Miller', number: 43, team: 'Yamaha Pramac', active: true },
    { name: 'Fabio Di Giannantonio', number: 49, team: 'Ducati VR46', active: true },
    { name: 'Fermín Aldeguer', number: 54, team: 'Ducati Gresini', active: true },
    { name: 'Francesco Bagnaia', number: 63, team: 'Ducati', active: true },
    { name: 'Marco Bezzecchi', number: 72, team: 'Aprilia', active: true },
    { name: 'Álex Márquez', number: 73, team: 'Ducati Gresini', active: true },
    { name: 'Ai Ogura', number: 79, 'Aprilia Trackhouse': true, team: 'Aprilia Trackhouse', active: true }, // Logic correction for team name mapping if needed, simplified below
    { name: 'Jorge Martín', number: 89, team: 'Aprilia', active: true },
    { name: 'Marc Márquez', number: 93, team: 'Ducati', active: true }
].map(r => ({ ...r, team: r.team || 'Unknown' })).map((r, i) => { if (r.number === 79) return { ...r, team: 'Aprilia Trackhouse' }; return r; }); // Quick fix for Ai Ogura object literal error in my mental array construct if any

const CLEAN_RIDERS = [
    { name: 'Johann Zarco', number: 5, team: 'Honda LCR', active: true },
    { name: 'Toprak Razgatlıoğlu', number: 7, team: 'Yamaha Pramac', active: true },
    { name: 'Luca Marini', number: 10, team: 'Honda HRC Castrol', active: true },
    { name: 'Diogo Moreira', number: 11, team: 'Honda LCR', active: true },
    { name: 'Maverick Viñales', number: 12, team: 'KTM Tech3', active: true },
    { name: 'Fabio Quartararo', number: 20, team: 'Yamaha', active: true },
    { name: 'Franco Morbidelli', number: 21, team: 'Ducati VR46', active: true },
    { name: 'Enea Bastianini', number: 23, team: 'KTM Tech3', active: true },
    { name: 'Raúl Fernández', number: 25, team: 'Aprilia Trackhouse', active: true },
    { name: 'Brad Binder', number: 33, team: 'KTM', active: true },
    { name: 'Joan Mir', number: 36, team: 'Honda HRC Castrol', active: true },
    { name: 'Pedro Acosta', number: 37, team: 'KTM', active: true },
    { name: 'Álex Rins', number: 42, team: 'Yamaha', active: true },
    { name: 'Jack Miller', number: 43, team: 'Yamaha Pramac', active: true },
    { name: 'Fabio Di Giannantonio', number: 49, team: 'Ducati VR46', active: true },
    { name: 'Fermín Aldeguer', number: 54, team: 'Ducati Gresini', active: true },
    { name: 'Francesco Bagnaia', number: 63, team: 'Ducati', active: true },
    { name: 'Marco Bezzecchi', number: 72, team: 'Aprilia', active: true },
    { name: 'Álex Márquez', number: 73, team: 'Ducati Gresini', active: true },
    { name: 'Ai Ogura', number: 79, team: 'Aprilia Trackhouse', active: true },
    { name: 'Jorge Martín', number: 89, team: 'Aprilia', active: true },
    { name: 'Marc Márquez', number: 93, team: 'Ducati', active: true }
]


const RACES = [
    { round_number: 1, name: 'Thailand', circuit: 'Chang International Circuit', country: 'Thailand', race_date: '2026-03-01', sprint_date: '2026-02-28', fp1_datetime: '2026-02-27 03:45:00+00', status: 'upcoming' },
    { round_number: 2, name: 'Brazil', circuit: 'Autódromo Internacional Ayrton Senna', country: 'Brazil', race_date: '2026-03-22', sprint_date: '2026-03-21', fp1_datetime: '2026-03-20 13:45:00+00', status: 'upcoming' },
    { round_number: 3, name: 'USA', circuit: 'Circuit of the Americas', country: 'USA', race_date: '2026-03-29', sprint_date: '2026-03-28', fp1_datetime: '2026-03-27 15:45:00+00', status: 'upcoming' },
    { round_number: 4, name: 'Qatar', circuit: 'Lusail International Circuit', country: 'Qatar', race_date: '2026-04-12', sprint_date: '2026-04-11', fp1_datetime: '2026-04-10 12:45:00+00', status: 'upcoming' },
    { round_number: 5, name: 'Spain', circuit: 'Circuito de Jerez – Ángel Nieto', country: 'Spain', race_date: '2026-04-26', sprint_date: '2026-04-25', fp1_datetime: '2026-04-24 08:45:00+00', status: 'upcoming' },
    { round_number: 6, name: 'France', circuit: 'Bugatti Circuit', country: 'France', race_date: '2026-05-10', sprint_date: '2026-05-09', fp1_datetime: '2026-05-08 08:45:00+00', status: 'upcoming' },
    { round_number: 7, name: 'Catalonia', circuit: 'Circuit de Barcelona-Catalunya', country: 'Spain', race_date: '2026-05-17', sprint_date: '2026-05-16', fp1_datetime: '2026-05-15 08:45:00+00', status: 'upcoming' },
    { round_number: 8, name: 'Italy', circuit: 'Autodromo Internazionale del Mugello', country: 'Italy', race_date: '2026-05-31', sprint_date: '2026-05-30', fp1_datetime: '2026-05-29 08:45:00+00', status: 'upcoming' },
    { round_number: 9, name: 'Hungary', circuit: 'Balaton Park Circuit', country: 'Hungary', race_date: '2026-06-07', sprint_date: '2026-06-06', fp1_datetime: '2026-06-05 08:45:00+00', status: 'upcoming' },
    { round_number: 10, name: 'Czech Republic', circuit: 'Brno Circuit', country: 'Czech Republic', race_date: '2026-06-21', sprint_date: '2026-06-20', fp1_datetime: '2026-06-19 08:45:00+00', status: 'upcoming' },
    { round_number: 11, name: 'Netherlands', circuit: 'TT Circuit Assen', country: 'Netherlands', race_date: '2026-06-28', sprint_date: '2026-06-27', fp1_datetime: '2026-06-26 08:45:00+00', status: 'upcoming' },
    { round_number: 12, name: 'Germany', circuit: 'Sachsenring', country: 'Germany', race_date: '2026-07-12', sprint_date: '2026-07-11', fp1_datetime: '2026-07-10 08:45:00+00', status: 'upcoming' },
    { round_number: 13, name: 'UK', circuit: 'Silverstone Circuit', country: 'United Kingdom', race_date: '2026-08-09', sprint_date: '2026-08-08', fp1_datetime: '2026-08-07 09:45:00+00', status: 'upcoming' },
    { round_number: 14, name: 'Aragon', circuit: 'MotorLand Aragón', country: 'Spain', race_date: '2026-08-30', sprint_date: '2026-08-29', fp1_datetime: '2026-08-28 08:45:00+00', status: 'upcoming' },
    { round_number: 15, name: 'San Marino', circuit: 'Misano World Circuit Marco Simoncelli', country: 'San Marino', race_date: '2026-09-13', sprint_date: '2026-09-12', fp1_datetime: '2026-09-11 08:45:00+00', status: 'upcoming' },
    { round_number: 16, name: 'Austria', circuit: 'Red Bull Ring', country: 'Austria', race_date: '2026-09-20', sprint_date: '2026-09-19', fp1_datetime: '2026-09-18 08:45:00+00', status: 'upcoming' },
    { round_number: 17, name: 'Japan', circuit: 'Mobility Resort Motegi', country: 'Japan', race_date: '2026-10-04', sprint_date: '2026-10-03', fp1_datetime: '2026-10-02 01:45:00+00', status: 'upcoming' },
    { round_number: 18, name: 'Indonesia', circuit: 'Pertamina Mandalika International Street Circuit', country: 'Indonesia', race_date: '2026-10-11', sprint_date: '2026-10-10', fp1_datetime: '2026-10-09 03:45:00+00', status: 'upcoming' },
    { round_number: 19, name: 'Australia', circuit: 'Phillip Island Grand Prix Circuit', country: 'Australia', race_date: '2026-10-25', sprint_date: '2026-10-24', fp1_datetime: '2026-10-23 00:45:00+00', status: 'upcoming' },
    { round_number: 20, name: 'Malaysia', circuit: 'Petronas Sepang International Circuit', country: 'Malaysia', race_date: '2026-11-01', sprint_date: '2026-10-31', fp1_datetime: '2026-10-30 02:45:00+00', status: 'upcoming' },
    { round_number: 21, name: 'Portugal', circuit: 'Algarve International Circuit', country: 'Portugal', race_date: '2026-11-15', sprint_date: '2026-11-14', fp1_datetime: '2026-11-13 10:45:00+00', status: 'upcoming' },
    { round_number: 22, name: 'Valencia', circuit: 'Circuit Ricardo Tormo', country: 'Spain', race_date: '2026-11-22', sprint_date: '2026-11-21', fp1_datetime: '2026-11-20 09:45:00+00', status: 'upcoming' }
]

async function resetProduction() {
    console.log('Starting production reset...')

    // 1. Wipe Data
    console.log('Cleaning up existing data...')
    await supabase.from('penalties').delete().neq('id', '00000000-0000-0000-0000-000000000000') // delete all
    await supabase.from('player_scores').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('race_predictions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('race_results').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('race_glorious_riders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('championship_predictions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('championship_results').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Delete races (requires cascading deletions usually, but dependencies are cleared above)
    try {
        const { error } = await supabase.from('races').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        if (error) {
            console.error('Error deleting races:', error)
        }
    } catch (e) {
        console.error('Exception deleting races:', e)
    }

    // Delete riders 
    try {
        const { error } = await supabase.from('riders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        if (error) {
            console.error('Error deleting riders:', error)
        }
    } catch (e) {
        console.error('Exception deleting riders:', e)
    }


    // 2. Insert Riders
    console.log('Inserting riders...')
    const { error: riderError } = await supabase.from('riders').insert(CLEAN_RIDERS)
    if (riderError) {
        console.error('Error inserting riders:', riderError)
        return
    }
    console.log('Riders inserted successfully.')

    // 3. Insert Races
    console.log('Inserting races...')
    const { error: raceError } = await supabase.from('races').insert(RACES)
    if (raceError) {
        console.error('Error inserting races:', raceError)
        return
    }
    console.log('Races inserted successfully.')

    console.log('Production reset complete!')
}

resetProduction().catch((err) => {
    console.error('Error resetting production:', err)
    process.exit(1)
})
