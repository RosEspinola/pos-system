// app.js
// The website's JavaScript. It talks to the server (server.js) using fetch().

let products = []; // all products from the server
let cart = [];     // items for the current customer: { id, name, price, qty }

// ---------- small helpers ----------
const $ = (id) => document.getElementById(id);

function money(amount) {
  return '₱' + Number(amount).toFixed(2);
}

// Makes text safe before putting it inside HTML
function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

let messageTimer;
function showMessage(text, type = 'success') {
  const box = $('message');
  box.textContent = text;
  box.className = 'message ' + type;
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => box.classList.add('hidden'), 3500);
}

// Sends a request to the server and returns the JSON answer
async function api(url, method = 'GET', body) {
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

// ---------- tabs ----------
document.querySelectorAll('.tab-btn').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    button.classList.add('active');
    document.querySelectorAll('.tab').forEach((t) => t.classList.add('hidden'));
    $('tab-' + button.dataset.tab).classList.remove('hidden');

    if (button.dataset.tab === 'report') loadReport();
    if (button.dataset.tab === 'products') renderProductsTable();
  });
});

// ---------- load products ----------
async function loadProducts() {
  try {
    products = await api('/api/products');
    renderGrid();
    renderProductsTable();
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

// ---------- NEW SALE: product cards ----------
function renderGrid() {
  const term = $('searchInput').value.toLowerCase();
  const list = products.filter((p) => p.name.toLowerCase().includes(term));

  if (list.length === 0) {
    $('productGrid').innerHTML = '<p class="empty">No products found.</p>';
    return;
  }

  $('productGrid').innerHTML = list.map((p) => `
    <button class="card ${p.stock === 0 ? 'out' : ''}" data-id="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>
      <span class="name">${esc(p.name)}</span>
      <span class="price">${money(p.price)}</span>
      <span class="stock">${p.stock === 0 ? 'Out of stock' : 'Stock: ' + p.stock}</span>
    </button>
  `).join('');
}

$('searchInput').addEventListener('input', renderGrid);

$('productGrid').addEventListener('click', (event) => {
  const card = event.target.closest('.card');
  if (card) addToCart(Number(card.dataset.id));
});

// ---------- NEW SALE: cart ----------
function addToCart(id) {
  const product = products.find((p) => p.id === id);
  if (!product) return;

  const existing = cart.find((item) => item.id === id);
  const currentQty = existing ? existing.qty : 0;

  if (currentQty + 1 > product.stock) {
    showMessage(`Not enough stock for ${product.name}.`, 'error');
    return;
  }

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
  }
  renderCart();
}

function getTotal() {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  return Math.round(total * 100) / 100;
}

function renderCart() {
  if (cart.length === 0) {
    $('cartList').innerHTML = '<p class="empty">Cart is empty. Click a product to add it.</p>';
  } else {
    $('cartList').innerHTML = cart.map((item) => `
      <div class="cart-item">
        <div class="info">
          ${esc(item.name)}
          <small>${money(item.price)} each = ${money(item.price * item.qty)}</small>
        </div>
        <div class="qty-box">
          <button data-action="dec" data-id="${item.id}">-</button>
          <input type="number" class="qty-input" min="1" step="1" value="${item.qty}" data-id="${item.id}">
          <button data-action="inc" data-id="${item.id}">+</button>
          <button data-action="remove" data-id="${item.id}">x</button>
        </div>
      </div>
    `).join('');
  }
  $('cartTotal').textContent = money(getTotal());
  updateChange();
}

$('cartList').addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  const id = Number(button.dataset.id);
  const action = button.dataset.action;
  const item = cart.find((i) => i.id === id);
  const product = products.find((p) => p.id === id);
  if (!item) return;

  if (action === 'inc') {
    if (item.qty + 1 > product.stock) {
      showMessage(`Not enough stock for ${item.name}.`, 'error');
      return;
    }
    item.qty += 1;
  } else if (action === 'dec') {
    item.qty -= 1;
    if (item.qty <= 0) cart = cart.filter((i) => i.id !== id);
  } else if (action === 'remove') {
    cart = cart.filter((i) => i.id !== id);
  }
  renderCart();
});

// Type a quantity directly in the box (press Enter or click outside)
$('cartList').addEventListener('change', (event) => {
  const input = event.target.closest('.qty-input');
  if (!input) return;

  const id = Number(input.dataset.id);
  const item = cart.find((i) => i.id === id);
  const product = products.find((p) => p.id === id);
  if (!item || !product) return;

  const qty = Number(input.value);

  if (input.value === '' || !Number.isInteger(qty)) {
    showMessage('Quantity must be a whole number.', 'error');
  } else if (qty <= 0) {
    cart = cart.filter((i) => i.id !== id); // 0 removes the item
  } else if (qty > product.stock) {
    item.qty = product.stock; // use the most we have
    showMessage(`Only ${product.stock} ${product.name} in stock.`, 'error');
  } else {
    item.qty = qty;
  }
  renderCart();
});

// Select the number when you click the box, so you can type right away
$('cartList').addEventListener('focusin', (event) => {
  if (event.target.classList.contains('qty-input')) event.target.select();
});

// Shows the change (or "not enough") while typing the payment
function updateChange() {
  const text = $('changeText');
  const paid = $('paidInput').value;
  const total = getTotal();

  if (paid === '' || cart.length === 0) {
    text.textContent = '';
    text.className = 'change-text';
    return;
  }
  if (Number(paid) < total) {
    text.textContent = 'Not enough payment.';
    text.className = 'change-text bad';
  } else {
    text.textContent = 'Change: ' + money(Number(paid) - total);
    text.className = 'change-text ok';
  }
}
$('paidInput').addEventListener('input', updateChange);

$('clearCartBtn').addEventListener('click', () => {
  cart = [];
  $('paidInput').value = '';
  renderCart();
});

// ---------- CHECKOUT ----------
$('checkoutBtn').addEventListener('click', async () => {
  if (cart.length === 0) {
    showMessage('The cart is empty.', 'error');
    return;
  }

  const paid = $('paidInput').value;
  if (paid === '' || Number(paid) < getTotal()) {
    showMessage('Please enter a payment that covers the total.', 'error');
    return;
  }

  try {
    const sale = await api('/api/checkout', 'POST', {
      items: cart.map((item) => ({ id: item.id, qty: item.qty })),
      paid: Number(paid),
    });
    showReceipt(sale);
    cart = [];
    $('paidInput').value = '';
    renderCart();
    loadProducts(); // refresh the stock numbers
  } catch (err) {
    showMessage(err.message, 'error');
  }
});

// ---------- RECEIPT ----------
function showReceipt(sale) {
  const rows = sale.items.map((item) => `
    <div class="row">
      <span>${item.qty} x ${esc(item.name)}</span>
      <span>${money(item.price * item.qty)}</span>
    </div>
  `).join('');

  $('receiptContent').innerHTML = `
    <div class="receipt">
      <h3>MY STORE</h3>
      <p class="center">Official Receipt</p>
      <hr>
      <div>Receipt #: ${sale.id}</div>
      <div>Date: ${esc(sale.date)}</div>
      <hr>
      ${rows}
      <hr>
      <div class="row"><strong>TOTAL</strong><strong>${money(sale.total)}</strong></div>
      <div class="row"><span>PAID</span><span>${money(sale.paid)}</span></div>
      <div class="row"><span>CHANGE</span><span>${money(sale.change)}</span></div>
      <hr>
      <p class="center">Thank you! Please come again.</p>
    </div>
  `;
  $('receiptModal').classList.remove('hidden');
}

$('printBtn').addEventListener('click', () => window.print());
$('closeReceiptBtn').addEventListener('click', () => $('receiptModal').classList.add('hidden'));

// ---------- PRODUCTS TAB ----------
function renderProductsTable() {
  if (products.length === 0) {
    $('productsTable').innerHTML = '<tr><td colspan="5" class="empty">No products yet.</td></tr>';
    return;
  }

  $('productsTable').innerHTML = products.map((p) => `
    <tr>
      <td>${p.id}</td>
      <td>${esc(p.name)}</td>
      <td>${money(p.price)}</td>
      <td class="${p.stock <= 5 ? 'low' : ''}">${p.stock}</td>
      <td>
        <button class="btn small" data-action="restock" data-id="${p.id}">Restock</button>
        <button class="btn small danger" data-action="delete" data-id="${p.id}">Delete</button>
      </td>
    </tr>
  `).join('');
}

$('addProductBtn').addEventListener('click', async () => {
  try {
    await api('/api/products', 'POST', {
      name: $('newName').value,
      price: $('newPrice').value,
      stock: $('newStock').value,
    });
    $('newName').value = '';
    $('newPrice').value = '';
    $('newStock').value = '';
    showMessage('Product added.');
    loadProducts();
  } catch (err) {
    showMessage(err.message, 'error');
  }
});

$('productsTable').addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  const id = Number(button.dataset.id);
  const product = products.find((p) => p.id === id);

  try {
    if (button.dataset.action === 'restock') {
      const amount = prompt(`How many to add to "${product.name}"?`);
      if (amount === null) return; // user pressed Cancel
      await api(`/api/products/${id}/restock`, 'POST', { amount });
      showMessage('Stock updated.');
    }

    if (button.dataset.action === 'delete') {
      if (!confirm(`Delete "${product.name}"?`)) return;
      await api(`/api/products/${id}`, 'DELETE');
      // also remove it from the cart if it is there
      cart = cart.filter((item) => item.id !== id);
      renderCart();
      showMessage('Product deleted.');
    }

    loadProducts();
  } catch (err) {
    showMessage(err.message, 'error');
  }
});

// ---------- REPORT TAB ----------
async function loadReport() {
  try {
    const data = await api('/api/sales');
    $('statCount').textContent = data.summary.count;
    $('statTotal').textContent = money(data.summary.totalSales);

    if (data.sales.length === 0) {
      $('reportTable').innerHTML = '<tr><td colspan="4" class="empty">No sales yet.</td></tr>';
      return;
    }

    $('reportTable').innerHTML = data.sales.map((sale) => `
      <tr>
        <td>${sale.id}</td>
        <td>${esc(sale.date)}</td>
        <td>${sale.items.map((i) => esc(i.qty + ' x ' + i.name)).join(', ')}</td>
        <td>${money(sale.total)}</td>
      </tr>
    `).join('');
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

// Clear all sales history
$('clearSalesBtn').addEventListener('click', async () => {
  if (!confirm('Clear ALL sales history? This cannot be undone.')) return;
  try {
    await api('/api/sales', 'DELETE');
    showMessage('Sales history cleared.');
    loadReport();
  } catch (err) {
    showMessage(err.message, 'error');
  }
});

// ---------- start ----------
renderCart();
loadProducts();