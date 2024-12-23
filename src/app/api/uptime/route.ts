import { NextResponse } from 'next/server';
import { withApiTracking } from '@/lib/api-tracker';

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

async function handler(request: Request) {
  // Always ping on every request to ensure activity
  await pingExternalUrl();

  return NextResponse.json({ 
    status: 'ok', 
    timestamp: Date.now()
  });
}

export const GET = withApiTracking('/api/uptime', handler);
