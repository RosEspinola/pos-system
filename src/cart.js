// cart.js
// The shopping cart for the current customer.
// It is only kept in memory, so it resets after each sale.

let items = [];

function addItem(product, qty) {
  const existing = items.find((item) => item.id === product.id);
  if (existing) {
    existing.qty += qty; // same product: just increase the quantity
  } else {
    items.push({ id: product.id, name: product.name, price: product.price, qty });
  }
}

function getQtyInCart(id) {
  const item = items.find((i) => i.id === id);
  return item ? item.qty : 0;
}

function getItems() {
  return items;
}

function getTotal() {
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  return Math.round(total * 100) / 100; // round to 2 decimals
}

function isEmpty() {
  return items.length === 0;
}

function clear() {
  items = [];
}

module.exports = { addItem, getQtyInCart, getItems, getTotal, isEmpty, clear };
