const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.EXCHANGE_RATE_API_KEY;
const BASE_URL = 'https://v6.exchangerate-api.com/v6';
const BASE_CURRENCY = 'USD';
const DATA_DIR = path.join(process.cwd(), 'data');
const CACHE_FILE = path.join(DATA_DIR, 'exchange-rates.json');

async function fetchAndSaveRates() {
    if (!API_KEY) {
        console.error('Error: EXCHANGE_RATE_API_KEY not found in .env.local');
        process.exit(1);
    }

    try {
        // Create data directory if it doesn't exist
        if (!fs.existsSync(DATA_DIR)) {
            console.log('Creating data directory...');
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        // Fetch rates from API
        console.log('Fetching exchange rates...');
        const response = await fetch(`${BASE_URL}/${API_KEY}/latest/${BASE_CURRENCY}`);
        const data = await response.json();

        if (data.result === 'error') {
            throw new Error(`API Error: ${data['error-type']}`);
        }

        // Prepare cache data
        const cacheData = {
            timestamp: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            rates: data.conversion_rates,
            lastUpdateUTC: data.time_last_update_utc,
            nextUpdateUTC: data.time_next_update_utc,
            baseCode: data.base_code
        };

        // Save to file
        console.log('Saving rates to file...');
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));

        console.log('Success! Exchange rates have been saved to:', CACHE_FILE);
        console.log('Number of rates:', Object.keys(data.conversion_rates).length);
        console.log('Last Update:', data.time_last_update_utc);
        console.log('Next Update:', data.time_next_update_utc);
    } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}

// Run the function
fetchAndSaveRates();
