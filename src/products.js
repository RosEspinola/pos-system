// products.js
// All functions that work with products (add, find, restock, remove).
// They are "async" because the data may come from a database.

const { readJSON, writeJSON } = require('./storage');

const FILE = 'products.json';

async function getAll() {
  return readJSON(FILE, []);
}

async function findById(id) {
  const products = await getAll();
  return products.find((product) => product.id === id);
}

async function add(name, price, stock) {
  const products = await getAll();
  // New id = highest id + 1 (or 1 if there are no products yet)
  const nextId = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;
  const newProduct = { id: nextId, name, price, stock };
  products.push(newProduct);
  await writeJSON(FILE, products);
  return newProduct;
}

// Use a positive amount to add stock, a negative amount to reduce it
async function changeStock(id, amount) {
  const products = await getAll();
  const product = products.find((p) => p.id === id);
  if (!product) return false;
  product.stock += amount;
  await writeJSON(FILE, products);
  return true;
}

// Changes the stock of many products and saves only ONCE (faster for checkout)
async function changeManyStocks(changes) {
  const products = await getAll();
  changes.forEach(({ id, amount }) => {
    const product = products.find((p) => p.id === id);
    if (product) product.stock += amount;
  });
  await writeJSON(FILE, products);
}

async function remove(id) {
  const products = await getAll();
  const remaining = products.filter((p) => p.id !== id);
  if (remaining.length === products.length) return false; // nothing was removed
  await writeJSON(FILE, remaining);
  return true;
}

module.exports = { getAll, findById, add, changeStock, changeManyStocks, remove };
