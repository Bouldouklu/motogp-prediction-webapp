export interface MotoGPSeason {
    id: string;
    year: number;
    current: boolean;
}

export interface MotoGPCircuit {
    id: string;
    name: string;
    place: string;
    nation: string;
}

export interface MotoGPEvent {
    id: string;
    name: string;
    test: boolean;
    date_start: string;
    date_end: string;
    status: string; // 'NOT-STARTED' | 'CURRENT' | 'FINISHED'
    circuit: MotoGPCircuit;
}

export interface MotoGPSession {
    id: string;
    type: string; // 'FP' | 'PR' | 'Q' | 'SPR' | 'WUP' | 'RAC'
    number: number | null;
    date: string; // ISO 8601 with timezone, e.g. "2026-02-27T10:45:00+00:00"
    status: string; // 'NOT-STARTED' | 'CURRENT' | 'FINISHED'
}

export interface MotoGPClassificationEntry {
    id: string;
    position: number;
    rider: {
        id: string;
        full_name: string;
        number: number;
        riders_api_uuid: string; // stable rider UUID — use as external_id
    };
    team: {
        id: string;
        name: string;
    };
    constructor: {
        id: string;
        name: string;
    };
}

export interface MotoGPRider {
    id: string;
    name: string;
    surname: string;
    current_career_step: {
        team: {
            name: string;
        };
        number: string;
    };
}

export interface MotoGPClassification {
    id: string;
    position: number;
    rider: {
        id: string;
        name: string;
        surname: string;
        number: number;
    };
    team: {
        name: string;
    }
}

export class MotoGPAPI {
    private static BASE_URL = 'https://api.motogp.pulselive.com/motogp/v1';
    private static RESULTS_URL = `${MotoGPAPI.BASE_URL}/results`;

    static async getSeasons(): Promise<MotoGPSeason[]> {
        const response = await fetch(`${this.RESULTS_URL}/seasons`);
        if (!response.ok) throw new Error('Failed to fetch seasons');
        return response.json();
    }

    static async getEvents(seasonId: string): Promise<MotoGPEvent[]> {
        const response = await fetch(`${this.RESULTS_URL}/events?seasonUuid=${seasonId}`);
        if (!response.ok) throw new Error('Failed to fetch events');
        return response.json();
    }

    /**
     * Get sessions for a specific event and category.
     * Returns FP, PR, Q, SPR, WUP, RAC sessions with exact datetimes.
     */
    static async getSessions(eventId: string, categoryId: string): Promise<MotoGPSession[]> {
        const response = await fetch(
            `${this.RESULTS_URL}/sessions?eventUuid=${eventId}&categoryUuid=${categoryId}`
        );
        if (!response.ok) throw new Error(`Failed to fetch sessions for event ${eventId}`);
        return response.json();
    }

    /**
     * Get the classification (results) for a finished session.
     * Returns all riders with their position, number, name, team, constructor.
     * Requires seasonYear and test flag for disambiguation.
     */
    static async getSessionClassification(
        sessionId: string,
        seasonYear: number,
        isTest: boolean = false
    ): Promise<{ classification: MotoGPClassificationEntry[] }> {
        const response = await fetch(
            `${this.RESULTS_URL}/session/${sessionId}/classification?seasonYear=${seasonYear}&test=${isTest}`
        );
        if (!response.ok) throw new Error(`Failed to fetch classification for session ${sessionId}`);
        return response.json();
    }

    /**
     * Fetch riders from the season endpoint.
     * NOTE: This endpoint returns 400 at the start of the season before
     * the API is updated. Use getRidersFromClassification() as a fallback.
     */
    static async getRiders(seasonId: string, categoryId: string = MOTOGP_CATEGORY_ID): Promise<MotoGPRider[]> {
        const response = await fetch(`${this.RESULTS_URL}/riders?seasonUuid=${seasonId}&categoryUuid=${categoryId}`);
        if (!response.ok) return [];
        return response.json();
    }

    // Helper to find current season
    static async getCurrentSeason(): Promise<MotoGPSeason | undefined> {
        const seasons = await this.getSeasons();
        return seasons.find(s => s.current);
    }
}

// Category ID for MotoGP class (stable constant)
export const MOTOGP_CATEGORY_ID = 'e8c110ad-64aa-4e8e-8a86-f2f152f6a942';
