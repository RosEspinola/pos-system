// sales.js
// Saves finished sales and builds the sales report.

const { readJSON, writeJSON } = require('./storage');

const FILE = 'sales.json';

function getAll() {
  return readJSON(FILE, []);
}

function save(items, total, paid, change) {
  const sales = getAll();
  const sale = {
    id: sales.length + 1,
    date: new Date().toLocaleString(),
    items: items.map((item) => ({ ...item })), // copy so clearing the cart won't affect it
    total,
    paid,
    change,
  };
  sales.push(sale);
  writeJSON(FILE, sales);
  return sale;
}

function getSummary() {
  const sales = getAll();
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  return {
    count: sales.length,
    totalSales: Math.round(totalSales * 100) / 100,
  };
}

module.exports = { getAll, save, getSummary };
