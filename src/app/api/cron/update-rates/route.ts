import { NextResponse } from 'next/server';
import { updateRatesCache } from '@/lib/api/exchange-rates';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET_KEY;

interface UpdateResponse {
  success: boolean;
  timestamp?: number;
  message?: string;
  error?: string;
}

export async function GET(request: Request): Promise<NextResponse<UpdateResponse>> {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized' 
        },
        { status: 401 }
      );
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
