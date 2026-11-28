// products.js
// All functions that work with products (add, find, restock, remove).
// Every account has its own product list, so each function starts with userId.

const { readJSON, writeJSON } = require('./storage');

function fileFor(userId) {
  return `products-${userId}.json`;
}

async function getAll(userId) {
  return readJSON(fileFor(userId), []);
}

async function findById(userId, id) {
  const products = await getAll(userId);
  return products.find((product) => product.id === id);
}

async function add(userId, name, price, stock) {
  const products = await getAll(userId);
  // New id = highest id + 1 (or 1 if there are no products yet)
  const nextId = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;
  const newProduct = { id: nextId, name, price, stock };
  products.push(newProduct);
  await writeJSON(fileFor(userId), products);
  return newProduct;
}

// Use a positive amount to add stock, a negative amount to reduce it
async function changeStock(userId, id, amount) {
  const products = await getAll(userId);
  const product = products.find((p) => p.id === id);
  if (!product) return false;
  product.stock += amount;
  await writeJSON(fileFor(userId), products);
  return true;
}

// Changes the stock of many products and saves only ONCE (faster for checkout)
async function changeManyStocks(userId, changes) {
  const products = await getAll(userId);
  changes.forEach(({ id, amount }) => {
    const product = products.find((p) => p.id === id);
    if (product) product.stock += amount;
  });
  await writeJSON(fileFor(userId), products);
}

async function remove(userId, id) {
  const products = await getAll(userId);
  const remaining = products.filter((p) => p.id !== id);
  if (remaining.length === products.length) return false; // nothing was removed
  await writeJSON(fileFor(userId), remaining);
  return true;
}

module.exports = { getAll, findById, add, changeStock, changeManyStocks, remove };