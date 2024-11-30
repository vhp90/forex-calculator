// Script to keep the serverless functions warm
const https = require('https');

// Configuration
const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes
const ENDPOINTS = [
  '/api/uptime',
  '/api/exchange-rates'
];

// Your production URL (update this)
const PRODUCTION_URL = process.env.NEXT_PUBLIC_APP_URL || 'your-production-url.vercel.app';

function pingEndpoint(endpoint) {
  const options = {
    hostname: PRODUCTION_URL.replace('https://', ''),
    path: endpoint,
    method: 'GET',
    headers: {
      'User-Agent': 'Warmup-Script'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`[${new Date().toISOString()}] Pinged ${endpoint} - Status: ${res.statusCode}`);
  });

  req.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] Error pinging ${endpoint}:`, error.message);
  });

  req.end();
}

function keepWarm() {
  ENDPOINTS.forEach(endpoint => {
    pingEndpoint(endpoint);
  });
}

// Initial ping
keepWarm();

// Schedule regular pings
setInterval(keepWarm, PING_INTERVAL);

console.log(`Started keep-warm script. Pinging ${ENDPOINTS.length} endpoints every ${PING_INTERVAL/1000} seconds.`);
