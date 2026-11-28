// storage.js
// Reads and writes the app's data.
//   - On your computer: it uses JSON files inside the /data folder.
//   - On Vercel: it uses an Upstash Redis database (Vercel cannot save files).
// It picks automatically: if the Redis keys exist, it uses Redis.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Vercel's Upstash integration adds these environment variables
const REST_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const USE_REDIS = Boolean(REST_URL && REST_TOKEN);

function checkSetup() {
  if (process.env.VERCEL && !USE_REDIS) {
    throw new Error(
      'Database is not connected. In Vercel, add an Upstash Redis database to this project, then redeploy.'
    );
  }
}

// Sends one command to Upstash, for example ["GET", "pos:products-abc.json"]
async function redis(command) {
  const response = await fetch(REST_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REST_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || 'Database error.');
  }
  return data.result;
}

// The starting products. A new account gets these the first time.
function getSeed(fileName) {
  if (fileName.startsWith('products-')) {
    return JSON.parse(JSON.stringify(require('../data/products.json')));
  }
  return null;
}

async function readJSON(fileName, fallback) {
  checkSetup();

  if (USE_REDIS) {
    const text = await redis(['GET', 'pos:' + fileName]);
    if (text === null) {
      const seed = getSeed(fileName);
      return seed !== null ? seed : fallback;
    }
    return JSON.parse(text);
  }

  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    const seed = getSeed(fileName);
    return seed !== null ? seed : fallback;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

async function writeJSON(fileName, data) {
  checkSetup();

  if (USE_REDIS) {
    await redis(['SET', 'pos:' + fileName, JSON.stringify(data)]);
    return;
  }

  fs.writeFileSync(path.join(DATA_DIR, fileName), JSON.stringify(data, null, 2));
}

module.exports = { readJSON, writeJSON };