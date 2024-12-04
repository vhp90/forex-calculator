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
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

if (!APP_URL) {
  console.error('RENDER_EXTERNAL_URL environment variable is not set');
  process.exit(1);
}

const endpoints = [
  '/api/health',
  '/api/uptime',
  '/api/exchange-rates'
];

async function pingEndpoint(endpoint, retryCount = 0) {
  const url = `${APP_URL}${endpoint}`;
  try {
    const protocol = url.startsWith('https') ? https : http;
    
    const response = await new Promise((resolve, reject) => {
      const req = protocol.get(url, {
        timeout: 10000, // 10 second timeout
        headers: {
          'User-Agent': 'Health-Check-Service'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });
    });

    if (response.statusCode >= 500) {
      throw new Error(`Server error: ${response.statusCode}`);
    }

    if (response.statusCode !== 200) {
      console.warn(`Warning: ${endpoint} returned status ${response.statusCode}`);
      return;
    }

    console.log(`Successfully pinged ${endpoint}`);
  } catch (error) {
    console.error(`Error pinging ${endpoint}: ${error.message}`);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying ${endpoint} in ${RETRY_DELAY/1000} seconds... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return pingEndpoint(endpoint, retryCount + 1);
    }
  }
}

async function keepWarm() {
  console.log('Starting keep-warm cycle...');
  
  // Ping endpoints sequentially to avoid overwhelming the server
  for (const endpoint of endpoints) {
    await pingEndpoint(endpoint);
    // Add small delay between pings
    await new Promise(resolve => setTimeout(resolve, 1000));
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
