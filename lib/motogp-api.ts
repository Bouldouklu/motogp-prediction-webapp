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
    circuit: MotoGPCircuit;
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
    private static BASE_URL = 'https://api.motogp.pulselive.com/motogp/v1/results';

    static async getSeasons(): Promise<MotoGPSeason[]> {
        const response = await fetch(`${this.BASE_URL}/seasons`);
        if (!response.ok) throw new Error('Failed to fetch seasons');
        return response.json();
    }

    static async getEvents(seasonId: string): Promise<MotoGPEvent[]> {
        const response = await fetch(`${this.BASE_URL}/events?seasonUuid=${seasonId}`);
        if (!response.ok) throw new Error('Failed to fetch events');
        const data = await response.json();
        return data;
    }

    static async getRiders(seasonId: string, categoryId: string = 'e8c110ad-64aa-4e8e-8a86-f2f152f6a942'): Promise<MotoGPRider[]> {
        // NOTE: categoryId for MotoGP is usually stable, but we might need to fetch categories
        // Endpoint: /riders?seasonUuid={seasonId}&categoryUuid={categoryId}
        const response = await fetch(`${this.BASE_URL}/riders?seasonUuid=${seasonId}&categoryUuid=${categoryId}`);
        if (!response.ok) return []; // Return empty if fails (some seasons might not have riders yet)
        return response.json();
    }

    // Helper to find current season
    static async getCurrentSeason(): Promise<MotoGPSeason | undefined> {
        const seasons = await this.getSeasons();
        return seasons.find(s => s.current);
    }
}

// Category ID for MotoGP class (constant based on observation)
export const MOTOGP_CATEGORY_ID = 'e8c110ad-64aa-4e8e-8a86-f2f152f6a942'; 
