// Script to keep the serverless functions warm
const https = require('https');
const http = require('http');

// Configuration
const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes
const ENDPOINTS = [
  '/api/uptime',
  '/api/exchange-rates'
];

// Your production URL (update this)
const APP_URL = process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';

function pingEndpoint(endpoint) {
  const url = new URL(endpoint, APP_URL);
  const client = url.protocol === 'https:' ? https : http;

  const req = client.get(url.toString(), (res) => {
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
