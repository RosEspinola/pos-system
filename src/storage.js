// storage.js
// Reads and writes JSON files inside the /data folder.
// This acts like a very simple database.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function readJSON(fileName, fallback) {
  const filePath = path.join(DATA_DIR, fileName);
  // If the file does not exist yet, return the fallback value
  if (!fs.existsSync(filePath)) {
    return fallback;
  }
  const text = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(text);
}

function writeJSON(fileName, data) {
  const filePath = path.join(DATA_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = { readJSON, writeJSON };
