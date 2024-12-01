import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Cache the last ping time
let lastPingTime = Date.now();

// Function to ping the external URL
async function pingExternalUrl() {
  const externalUrl = process.env.RENDER_EXTERNAL_URL;
  if (!externalUrl) {
    console.warn('RENDER_EXTERNAL_URL not set');
    return;
  }

  try {
    const response = await fetch(`${externalUrl}/api/uptime`);
    if (!response.ok) {
      console.warn('Self-ping failed:', response.status);
    }
  } catch (error) {
    console.error('Self-ping error:', error);
  }
}

export async function GET() {
  const currentTime = Date.now();
  const timeSinceLastPing = currentTime - lastPingTime;
  const TEN_MINUTES = 10 * 60 * 1000; // 10 minutes in milliseconds

  // If it's been more than 10 minutes since the last ping, initiate a new ping
  if (timeSinceLastPing > TEN_MINUTES) {
    lastPingTime = currentTime;
    // Don't await the ping to avoid blocking the response
    pingExternalUrl().catch(console.error);
  }

  return NextResponse.json({ 
    status: 'ok', 
    timestamp: currentTime,
    lastPing: lastPingTime
  });
}
