import { NextResponse } from 'next/server';
import { updateRatesCache } from '@/lib/api/exchange-rates';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET_KEY;

export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Update rates cache
    const updatedRates = await updateRatesCache();

    return NextResponse.json({
      success: true,
      timestamp: updatedRates.timestamp,
      message: 'Exchange rates updated successfully'
    });
  } catch (error) {
    console.error('Error updating exchange rates:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
