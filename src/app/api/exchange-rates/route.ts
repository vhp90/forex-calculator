import { NextResponse } from 'next/server';
import { withApiTracking } from '@/lib/api-tracker';
import { getExchangeRate, fetchExchangeRates } from '@/lib/api/exchange-rates';
import { Currency } from '@/lib/api/types';

async function handler(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from')?.toUpperCase();
  const to = searchParams.get('to')?.toUpperCase();

  // If no parameters provided, return all USD rates
  if (!from && !to) {
    try {
      const data = await fetchExchangeRates();
      return NextResponse.json(data);
    } catch (error) {
      return NextResponse.json({ error: 'Failed to fetch USD rates' }, { status: 500 });
    }
  }

  // Validate required parameters for specific exchange rate
  if (!from || !to) {
    return NextResponse.json(
      { error: 'Missing required parameters: from and to currencies' },
      { status: 400 }
    );
  }

  try {
    const rate = await getExchangeRate(from as Currency, to as Currency);
    return NextResponse.json(rate);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const GET = withApiTracking('/api/exchange-rates', handler);
