import { NextResponse } from 'next/server';
import { withApiTracking } from '@/lib/analytics-store';

// Function to ping the external URL
async function pingExternalUrl() {
  const externalUrl = process.env.RENDER_EXTERNAL_URL;
  if (!externalUrl) {
    console.warn('RENDER_EXTERNAL_URL not set');
    return;
  }

  try {
    const response = await fetch(`${externalUrl}/api/health`, {
      // Add cache-control headers to prevent caching
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    if (!response.ok) {
      console.warn('Self-ping failed:', response.status);
    }
  } catch (error) {
    console.error('Self-ping error:', error);
  }
}

// Set revalidate to 0 to prevent caching
export const revalidate = 0;

export async function GET() {
  // Always ping on every request to ensure activity
  await pingExternalUrl();

  return withApiTracking('/api/uptime', async () => {
    return NextResponse.json({ 
      status: 'ok', 
      timestamp: Date.now()
    });
  });
}
