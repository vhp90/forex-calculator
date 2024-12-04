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

const HEALTH_CHECK_PORT = 3001;  // Use a fixed different port
server.listen(HEALTH_CHECK_PORT, () => {
  console.log(`Health check server running on port ${HEALTH_CHECK_PORT}`);
});

// Keep-warm functionality
const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes
const APP_URL = process.env.RENDER_EXTERNAL_URL;

if (!APP_URL) {
  console.error('RENDER_EXTERNAL_URL environment variable is not set');
  process.exit(1);
}

const endpoints = [
  '/api/health',
  '/api/uptime'
];

function pingEndpoint(endpoint) {
  const url = new URL(endpoint, APP_URL);
  const client = url.protocol === 'https:' ? https : http;

  const req = client.get(url.toString(), (res) => {
    if (res.statusCode === 200) {
      console.log(`[${new Date().toISOString()}] Successfully pinged ${endpoint} - Status: ${res.statusCode}`);
    } else {
      console.error(`[${new Date().toISOString()}] Failed to ping ${endpoint} - Status: ${res.statusCode}`);
    }
  });

  req.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] Error pinging ${endpoint}:`, error.message);
  });

  // Set a timeout to prevent hanging connections
  req.setTimeout(5000, () => {
    console.error(`[${new Date().toISOString()}] Timeout pinging ${endpoint}`);
    req.destroy();
  });

  req.end();
}

async function keepWarm() {
  console.log(`[${new Date().toISOString()}] Starting ping cycle...`);
  
  for (const endpoint of endpoints) {
    try {
      await new Promise((resolve) => {
        pingEndpoint(endpoint);
        // Wait a bit between pings to prevent rate limiting
        setTimeout(resolve, 1000);
      });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error in ping cycle:`, error);
    }
  }
}

// Initial ping with a delay to ensure server is fully started
setTimeout(() => {
  keepWarm();
  // Schedule regular pings
  setInterval(keepWarm, PING_INTERVAL);
}, 5000);

// Handle process termination
process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal');
  server.close(() => {
    console.log('Health check server terminated');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Keep the process running despite uncaught exceptions
});
