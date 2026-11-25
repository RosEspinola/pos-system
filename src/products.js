// products.js
// All functions that work with products (add, find, restock, remove).

const { readJSON, writeJSON } = require('./storage');

const FILE = 'products.json';

function getAll() {
  return readJSON(FILE, []);
}

function findById(id) {
  return getAll().find((product) => product.id === id);
}

function add(name, price, stock) {
  const products = getAll();
  // New id = highest id + 1 (or 1 if there are no products yet)
  const nextId = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;
  const newProduct = { id: nextId, name, price, stock };
  products.push(newProduct);
  writeJSON(FILE, products);
  return newProduct;
}

// Use a positive amount to add stock, a negative amount to reduce it
function changeStock(id, amount) {
  const products = getAll();
  const product = products.find((p) => p.id === id);
  if (!product) return false;
  product.stock += amount;
  writeJSON(FILE, products);
  return true;
}

function remove(id) {
  const products = getAll();
  const remaining = products.filter((p) => p.id !== id);
  if (remaining.length === products.length) return false; // nothing was removed
  writeJSON(FILE, remaining);
  return true;
}

module.exports = { getAll, findById, add, changeStock, remove };
