
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
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY or SERVICE_ROLE_KEY. Available keys:', Object.keys(process.env).filter(k => k.includes('KEY') || k.includes('SUPABASE')))
}

const supabase = createClient(supabaseUrl, supabaseServiceKey!)

// --- duplicated types and logic from lib/scoring.ts to avoid import issues in standalone script ---

function calculatePositionPoints(
    predictedPosition: number,
    actualPosition: number,
    type: 'winner' | 'glorious7'
): number {
    const diff = Math.abs(predictedPosition - actualPosition)

    if (type === 'winner') {
        const pointsMap: Record<number, number> = {
            0: 12, 1: 9, 2: 7, 3: 5, 4: 4, 5: 2,
        }
        return pointsMap[diff] ?? 0
    }

    if (type === 'glorious7') {
        const pointsMap: Record<number, number> = {
            0: 12, 1: 9, 2: 7, 3: 5, 4: 4,
        }
        return pointsMap[diff] ?? 0
    }

    return 0
}

function calculatePenalty(offenseNumber: number): number {
    if (offenseNumber === 1) return 10
    if (offenseNumber === 2) return 25
    return 50
}

// --- End duplicated logic ---

const CIRCUITS = [
    { name: 'Qatar Airways Grand Prix of Qatar', circuit: 'Lusail International Circuit', country: 'Qatar' },
    { name: 'Grande Prémio de Portugal', circuit: 'Autódromo Internacional do Algarve', country: 'Portugal' },
    { name: 'Red Bull Grand Prix of the Americas', circuit: 'Circuit Of The Americas', country: 'USA' },
    { name: 'Gran Premio de España', circuit: 'Circuito de Jerez – Ángel Nieto', country: 'Spain' },
    { name: 'Grand Prix de France', circuit: 'Le Mans', country: 'France' },
    { name: 'Gran Premi de Catalunya', circuit: 'Circuit de Barcelona-Catalunya', country: 'Spain' },
    { name: 'Gran Premio d\'Italia', circuit: 'Autodromo Internazionale del Mugello', country: 'Italy' },
    { name: 'Kazakhstan Grand Prix', circuit: 'Sokol International Racetrack', country: 'Kazakhstan' },
    { name: 'Motul TT Assen', circuit: 'TT Circuit Assen', country: 'Netherlands' },
    { name: 'Liqui Moly Motorrad Grand Prix Deutschland', circuit: 'Sachsenring', country: 'Germany' },
    { name: 'Monster Energy British Grand Prix', circuit: 'Silverstone Circuit', country: 'UK' },
    { name: 'Motorrad Grand Prix von Österreich', circuit: 'Red Bull Ring – Spielberg', country: 'Austria' },
    { name: 'Gran Premio de Aragón', circuit: 'MotorLand Aragón', country: 'Spain' },
    { name: 'Gran Premio di San Marino', circuit: 'Misano World Circuit Marco Simoncelli', country: 'San Marino' },
    { name: 'Grand Prix of India', circuit: 'Buddh International Circuit', country: 'India' },
    { name: 'Pertamina Grand Prix of Indonesia', circuit: 'Pertamina Mandalika Circuit', country: 'Indonesia' },
    { name: 'Motul Grand Prix of Japan', circuit: 'Mobility Resort Motegi', country: 'Japan' },
    { name: 'Australian Motorcycle Grand Prix', circuit: 'Phillip Island', country: 'Australia' },
    { name: 'OR Thailand Grand Prix', circuit: 'Chang International Circuit', country: 'Thailand' },
    { name: 'Petronas Grand Prix of Malaysia', circuit: 'Sepang International Circuit', country: 'Malaysia' },
    { name: 'Gran Premio de la Comunitat Valenciana', circuit: 'Circuit Ricardo Tormo', country: 'Spain' },
]

async function seedHalftime() {
    console.log('Starting halftime simulation...')

    // 1. Wipe Data
    console.log('Cleaning up existing data...')
    await supabase.from('penalties').delete().neq('id', '00000000-0000-0000-0000-000000000000') // delete all
    await supabase.from('player_scores').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('race_predictions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('race_results').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('race_glorious_riders').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    // We can't delete directly from races without cascade usually, but predictions/results are gone.
    // Note: if riders/players reference races, it might be an issue. But checking schema, they don't.
    // Races are referenced by... nothing else than what we just deleted.
    try {
        const { error } = await supabase.from('races').delete().neq('id', '00000000-0000-0000-0000-000000000000')
        if (error) {
            console.error('Error deleting races:', error)
        }
    } catch (e) {
        console.error('Exception deleting races:', e)
    }

    // 2. Fetch Riders & Players
    // Use .limit(100) or assume <1000 active riders
    const { data: riders } = await supabase.from('riders').select('id, number').eq('active', true)
    if (!riders || riders.length < 20) {
        throw new Error('Not enough active riders found. Please seed riders first.')
    }
    const riderIds = riders.map(r => r.id)

    const { data: players } = await supabase.from('players').select('id')
    if (!players || players.length === 0) {
        throw new Error('No players found. Please seed players first.')
    }
    console.log(`Found ${players.length} players and ${riders.length} riders.`)


    // 3. Generate Races (10 completed, 11 upcoming)
    const racesToInsert = []
    const today = new Date()

    // Previous races (Completed)
    for (let i = 0; i < 10; i++) {
        const raceDate = new Date(today)
        raceDate.setDate(today.getDate() - (10 - i) * 7) // weekly races in the past

        // FP1 was Friday before
        const fp1Date = new Date(raceDate)
        fp1Date.setDate(raceDate.getDate() - 2)
        fp1Date.setHours(10, 0, 0, 0)

        // Sprint was Saturday
        const sprintDate = new Date(raceDate)
        sprintDate.setDate(raceDate.getDate() - 1)

        racesToInsert.push({
            round_number: i + 1,
            name: CIRCUITS[i].name,
            circuit: CIRCUITS[i].circuit,
            country: CIRCUITS[i].country,
            race_date: raceDate.toISOString().split('T')[0], // YYYY-MM-DD
            sprint_date: sprintDate.toISOString().split('T')[0],
            fp1_datetime: fp1Date.toISOString(),
            status: 'completed'
        })
    }

    // Upcoming races (Upcoming)
    for (let i = 10; i < 21; i++) {
        const raceDate = new Date(today)
        raceDate.setDate(today.getDate() + (i - 9) * 7) // weekly races in the future, starting next week

        // FP1
        const fp1Date = new Date(raceDate)
        fp1Date.setDate(raceDate.getDate() - 2)
        fp1Date.setHours(10, 0, 0, 0)

        // Sprint
        const sprintDate = new Date(raceDate)
        sprintDate.setDate(raceDate.getDate() - 1)

        racesToInsert.push({
            round_number: i + 1,
            name: CIRCUITS[i].name,
            circuit: CIRCUITS[i].circuit,
            country: CIRCUITS[i].country,
            race_date: raceDate.toISOString().split('T')[0],
            sprint_date: sprintDate.toISOString().split('T')[0],
            fp1_datetime: fp1Date.toISOString(),
            status: 'upcoming'
        })
    }

    console.log('Inserting races...')
    const { data: insertedRaces, error: raceError } = await supabase
        .from('races')
        .insert(racesToInsert)
        .select()

    if (raceError) {
        console.error('Race insert error:', raceError)
        throw raceError
    }
    if (!insertedRaces) throw new Error('Failed to insert races')

    const completedRaces = insertedRaces.filter(r => r.status === 'completed')
    console.log(`Inserted ${insertedRaces.length} races (${completedRaces.length} completed).`)

    // 4. Generate Results & Predictions for Completed Races
    for (const race of completedRaces) {
        // A. Choose Glorious 7 Riders for this race
        // Randomly select 7 riders
        const shuffledRiders = [...riderIds].sort(() => 0.5 - Math.random())
        const gloriousRiderIds = shuffledRiders.slice(0, 7)

        // Insert into race_glorious_riders
        const gloriousPayload = gloriousRiderIds.map((rid, idx) => ({
            race_id: race.id,
            rider_id: rid,
            display_order: idx + 1
        }))
        const { error: gError } = await supabase.from('race_glorious_riders').insert(gloriousPayload)
        if (gError) console.error('Error inserting glorious riders:', gError)

        // B. Generate Race Results (Top 20 for Sprint & Race)
        // SPRINT
        const shuffledSprint = [...riderIds].sort(() => 0.5 - Math.random())
        const sprintResults = shuffledSprint.slice(0, 20).map((rid, idx) => ({
            race_id: race.id,
            result_type: 'sprint',
            position: idx + 1,
            rider_id: rid
        }))

        // RACE
        const shuffledRace = [...riderIds].sort(() => 0.5 - Math.random())
        const raceResults = shuffledRace.slice(0, 20).map((rid, idx) => ({
            race_id: race.id,
            result_type: 'race',
            position: idx + 1,
            rider_id: rid
        }))

        const { error: rError } = await supabase.from('race_results').insert([...sprintResults, ...raceResults])
        if (rError) console.error('Error inserting results:', rError)

        // C. Predictions & Scoring per Player
        for (const player of players) {
            // 90% chance player made a prediction
            if (Math.random() > 0.1) {
                // Random prediction
                const pSprint = [...riderIds].sort(() => 0.5 - Math.random())
                const pRace = [...riderIds].sort(() => 0.5 - Math.random())

                // Pick top 3 from the KNOWN glorious 7 for this race
                const pGlorious = [...gloriousRiderIds].sort(() => 0.5 - Math.random())

                // 10% chance it was late (for 1st race only to keep it simple, or random)
                const isLate = Math.random() < 0.1

                const prediction = {
                    player_id: player.id,
                    race_id: race.id,
                    sprint_1st_id: pSprint[0],
                    sprint_2nd_id: pSprint[1],
                    sprint_3rd_id: pSprint[2],
                    race_1st_id: pRace[0],
                    race_2nd_id: pRace[1],
                    race_3rd_id: pRace[2],
                    glorious_1st_id: pGlorious[0],
                    glorious_2nd_id: pGlorious[1],
                    glorious_3rd_id: pGlorious[2],
                    is_late: isLate,
                    submitted_at: new Date(new Date(race.fp1_datetime).getTime() - 1000000).toISOString() // submitted before
                }

                // Insert prediction
                const { error: pError } = await supabase.from('race_predictions').insert(prediction)
                if (pError) console.error('Error inserting prediction:', pError)

                // Calculate Score
                let sprint1stPoints = 0
                let sprint2ndPoints = 0
                let sprint3rdPoints = 0
                let race1stPoints = 0
                let race2ndPoints = 0
                let race3rdPoints = 0
                let gloriousPoints = 0
                let penaltyPoints = 0

                // Sprint Scores
                const s1Pos = sprintResults.find(r => r.rider_id === prediction.sprint_1st_id)?.position
                if (s1Pos) sprint1stPoints = calculatePositionPoints(s1Pos, 1, 'winner')

                const s2Pos = sprintResults.find(r => r.rider_id === prediction.sprint_2nd_id)?.position
                if (s2Pos) sprint2ndPoints = calculatePositionPoints(s2Pos, 2, 'winner')

                const s3Pos = sprintResults.find(r => r.rider_id === prediction.sprint_3rd_id)?.position
                if (s3Pos) sprint3rdPoints = calculatePositionPoints(s3Pos, 3, 'winner')

                // Race Scores
                const r1Pos = raceResults.find(r => r.rider_id === prediction.race_1st_id)?.position
                if (r1Pos) race1stPoints = calculatePositionPoints(r1Pos, 1, 'winner')

                const r2Pos = raceResults.find(r => r.rider_id === prediction.race_2nd_id)?.position
                if (r2Pos) race2ndPoints = calculatePositionPoints(r2Pos, 2, 'winner')

                const r3Pos = raceResults.find(r => r.rider_id === prediction.race_3rd_id)?.position
                if (r3Pos) race3rdPoints = calculatePositionPoints(r3Pos, 3, 'winner')

                // Glorious 7 Scores (Mini-League)
                // 1. Filter race results to only include the 7 selected riders
                const gloriousResults = raceResults
                    .filter(r => gloriousRiderIds.includes(r.rider_id))
                    .sort((a, b) => a.position - b.position)

                // Helper
                const getRelativePosition = (riderId: string): number | undefined => {
                    const index = gloriousResults.findIndex(r => r.rider_id === riderId)
                    return index !== -1 ? index + 1 : undefined
                }

                const g1Pos = getRelativePosition(prediction.glorious_1st_id)
                if (g1Pos !== undefined) gloriousPoints += calculatePositionPoints(g1Pos, 1, 'winner')

                const g2Pos = getRelativePosition(prediction.glorious_2nd_id)
                if (g2Pos !== undefined) gloriousPoints += calculatePositionPoints(g2Pos, 2, 'winner')

                const g3Pos = getRelativePosition(prediction.glorious_3rd_id)
                if (g3Pos !== undefined) gloriousPoints += calculatePositionPoints(g3Pos, 3, 'winner')

                if (prediction.is_late) {
                    penaltyPoints = calculatePenalty(1)
                }

                const playerScore: any = {
                    player_id: prediction.player_id,
                    race_id: prediction.race_id,
                    sprint_1st_points: sprint1stPoints,
                    sprint_2nd_points: sprint2ndPoints,
                    sprint_3rd_points: sprint3rdPoints,
                    race_1st_points: race1stPoints,
                    race_2nd_points: race2ndPoints,
                    race_3rd_points: race3rdPoints,
                    glorious_7_points: gloriousPoints,
                    penalty_points: penaltyPoints
                }

                const { error: scoreError } = await supabase.from('player_scores').insert(playerScore)
                if (scoreError) console.error('Error inserting score:', scoreError)
            }
        }
    }

    // 5. Generate Predictions for Upcoming Races
    const nextRace = insertedRaces.find(r => r.status === 'upcoming')
    if (nextRace) {
        // Generate Glorious 7 riders for next race too
        const shuffledRiders = [...riderIds].sort(() => 0.5 - Math.random())
        const gloriousRiderIds = shuffledRiders.slice(0, 7)

        // Insert into race_glorious_riders
        const gloriousPayload = gloriousRiderIds.map((rid, idx) => ({
            race_id: nextRace.id,
            rider_id: rid,
            display_order: idx + 1
        }))
        await supabase.from('race_glorious_riders').insert(gloriousPayload)

        // Create predictions for some users
        for (const player of players) {
            if (Math.random() > 0.5) { // 50% have already predicted
                const pSprint = [...riderIds].sort(() => 0.5 - Math.random())
                const pRace = [...riderIds].sort(() => 0.5 - Math.random())
                const pGlorious = [...gloriousRiderIds].sort(() => 0.5 - Math.random())

                await supabase.from('race_predictions').insert({
                    player_id: player.id,
                    race_id: nextRace.id,
                    sprint_1st_id: pSprint[0],
                    sprint_2nd_id: pSprint[1],
                    sprint_3rd_id: pSprint[2],
                    race_1st_id: pRace[0],
                    race_2nd_id: pRace[1],
                    race_3rd_id: pRace[2],
                    glorious_1st_id: pGlorious[0],
                    glorious_2nd_id: pGlorious[1],
                    glorious_3rd_id: pGlorious[2]
                })
            }
        }
    }

    console.log('Halftime simulation complete!')
}

seedHalftime().catch((err) => {
    console.error('Error seeding halftime:', err)
    process.exit(1)
})
