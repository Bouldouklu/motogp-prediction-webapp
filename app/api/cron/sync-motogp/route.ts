import { NextRequest, NextResponse } from 'next/server';
import { SyncService } from '@/lib/sync-service';
import { MotoGPAPI } from '@/lib/motogp-api';

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    // action: 'all' | 'riders' | 'races' | 'session-times'
    const action = searchParams.get('action') || 'all';
    const yearParam = searchParams.get('year');

    try {
        let year: number;
        if (yearParam) {
            year = parseInt(yearParam);
        } else {
            const currentSeason = await MotoGPAPI.getCurrentSeason();
            if (!currentSeason) throw new Error('No current season found');
            year = currentSeason.year;
        }

        const results: Record<string, unknown> = {};

        if (action === 'all' || action === 'riders') {
            results.riders = await SyncService.syncRiders(year);
        }

        if (action === 'all' || action === 'races') {
            await SyncService.syncRaces(year);
            results.races = 'synced';
        }

        // Sync exact FP1 times from sessions API (runs after races so rows exist)
        if (action === 'all' || action === 'races' || action === 'session-times') {
            results.sessionTimes = await SyncService.syncSessionTimes(year);
        }

        return NextResponse.json({ success: true, year, results });
    } catch (error: any) {
        console.error('Sync failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
