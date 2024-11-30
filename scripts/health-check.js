const http = require('http');
const https = require('https');

// Health check server
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`);
});

// Keep-warm functionality
const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes
const APP_URL = process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';

const endpoints = [
  '/api/uptime',
  '/api/exchange-rates'
];

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
  endpoints.forEach(endpoint => {
    pingEndpoint(endpoint);
  });
}

// Initial ping
keepWarm();

// Schedule regular pings
setInterval(keepWarm, PING_INTERVAL);

// Handle process termination
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Health check server terminated');
    process.exit(0);
  });
});
