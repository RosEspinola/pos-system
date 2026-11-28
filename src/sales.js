// sales.js
// Saves finished sales and builds the sales report.

const { readJSON, writeJSON } = require('./storage');

const FILE = 'sales.json';

async function getAll() {
  return readJSON(FILE, []);
}

async function save(items, total, paid, change) {
  const sales = await getAll();
  const sale = {
    id: sales.length + 1,
    // Fixed to Philippine time, so the receipt is right even on Vercel (which uses UTC)
    date: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
    items: items.map((item) => ({ ...item })), // copy so clearing the cart won't affect it
    total,
    paid,
    change,
  };
  sales.push(sale);
  await writeJSON(FILE, sales);
  return sale;
}

async function getSummary() {
  const sales = await getAll();
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  return {
    count: sales.length,
    totalSales: Math.round(totalSales * 100) / 100,
  };
}

// Deletes all sales history (the next sale starts again at #1)
async function clear() {
  await writeJSON(FILE, []);
}

module.exports = { getAll, save, getSummary, clear };