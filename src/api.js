// api.js
// All the API routes of the POS (products, checkout, sales).
// It is used by BOTH:
//   - src/server.js          (running on your computer)
//   - api/index.js             (running on Vercel)

const products = require('./products');
const sales = require('./sales');

// ---------- helpers ----------
function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

// Reads the JSON that the website sends us
function readBody(req) {
  return new Promise((resolve, reject) => {
    // On Vercel, the body is already read and placed in req.body
    if (req.body !== undefined && req.body !== null) {
      if (Buffer.isBuffer(req.body)) req.body = req.body.toString();
      if (typeof req.body === 'string') {
        if (req.body === '') return resolve({});
        try {
          return resolve(JSON.parse(req.body));
        } catch {
          return reject(new Error('Invalid JSON.'));
        }
      }
      return resolve(req.body);
    }
    if (req.readableEnded) return resolve({});

    // On your computer, we read the body piece by piece
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        reject(new Error('Request is too large.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON.'));
      }
    });
  });
}

function round2(number) {
  return Math.round(number * 100) / 100;
}

// ---------- routes ----------
async function handleApi(req, res, pathname) {
  const method = req.method;

  try {
    // GET /api/products -> list all products
    if (pathname === '/api/products' && method === 'GET') {
      return sendJSON(res, 200, await products.getAll());
    }

    // POST /api/products -> add a new product
    if (pathname === '/api/products' && method === 'POST') {
      const { name, price, stock } = await readBody(req);
      const cleanName = String(name || '').trim();
      const priceNumber = Number(price);
      const stockNumber = Number(stock);

      if (!cleanName) return sendJSON(res, 400, { error: 'Product name is required.' });
      if (price === '' || price === null || isNaN(priceNumber) || priceNumber < 0) {
        return sendJSON(res, 400, { error: 'Price must be a number (0 or more).' });
      }
      if (stock === '' || stock === null || !Number.isInteger(stockNumber) || stockNumber < 0) {
        return sendJSON(res, 400, { error: 'Stock must be a whole number (0 or more).' });
      }
      return sendJSON(res, 201, await products.add(cleanName, priceNumber, stockNumber));
    }

    // POST /api/products/:id/restock and DELETE /api/products/:id
    const match = pathname.match(/^\/api\/products\/(\d+)(\/restock)?$/);
    if (match) {
      const id = Number(match[1]);

      if (match[2] && method === 'POST') {
        const { amount } = await readBody(req);
        const amountNumber = Number(amount);
        if (!Number.isInteger(amountNumber) || amountNumber <= 0) {
          return sendJSON(res, 400, { error: 'Amount must be a whole number greater than 0.' });
        }
        if (!(await products.changeStock(id, amountNumber))) {
          return sendJSON(res, 404, { error: 'Product not found.' });
        }
        return sendJSON(res, 200, await products.findById(id));
      }

      if (!match[2] && method === 'DELETE') {
        if (!(await products.remove(id))) {
          return sendJSON(res, 404, { error: 'Product not found.' });
        }
        return sendJSON(res, 200, { message: 'Product removed.' });
      }
    }

    // POST /api/checkout -> finish a sale
    if (pathname === '/api/checkout' && method === 'POST') {
      const { items, paid } = await readBody(req);

      if (!Array.isArray(items) || items.length === 0) {
        return sendJSON(res, 400, { error: 'The cart is empty.' });
      }

      // Combine duplicate products, then check each one using the REAL data
      const wanted = {};
      for (const item of items) {
        const id = Number(item.id);
        const qty = Number(item.qty);
        if (!Number.isInteger(qty) || qty <= 0) {
          return sendJSON(res, 400, { error: 'Quantity must be a whole number greater than 0.' });
        }
        wanted[id] = (wanted[id] || 0) + qty;
      }

      const allProducts = await products.getAll();
      const lines = [];
      for (const id of Object.keys(wanted)) {
        const product = allProducts.find((p) => p.id === Number(id));
        if (!product) return sendJSON(res, 400, { error: 'A product in the cart was not found.' });
        if (wanted[id] > product.stock) {
          return sendJSON(res, 400, {
            error: `Not enough stock for ${product.name}. Only ${product.stock} left.`,
          });
        }
        lines.push({ id: product.id, name: product.name, price: product.price, qty: wanted[id] });
      }

      const total = round2(lines.reduce((sum, line) => sum + line.price * line.qty, 0));
      const paidNumber = Number(paid);
      if (paid === '' || paid === null || isNaN(paidNumber) || paidNumber < total) {
        return sendJSON(res, 400, { error: 'Payment is not enough.' });
      }

      const change = round2(paidNumber - total);
      // lower the stock of every item sold (saved once)
      await products.changeManyStocks(lines.map((line) => ({ id: line.id, amount: -line.qty })));
      const sale = await sales.save(lines, total, paidNumber, change);
      return sendJSON(res, 201, sale);
    }

    // GET /api/sales -> sales report
    if (pathname === '/api/sales' && method === 'GET') {
      const allSales = await sales.getAll();
      return sendJSON(res, 200, {
        summary: await sales.getSummary(),
        sales: allSales.reverse(), // newest first
      });
    }

    // DELETE /api/sales -> clear the sales history
    if (pathname === '/api/sales' && method === 'DELETE') {
      await sales.clear();
      return sendJSON(res, 200, { message: 'Sales history cleared.' });
    }

    sendJSON(res, 404, { error: 'Not found.' });
  } catch (err) {
    sendJSON(res, 400, { error: err.message });
  }
}

module.exports = { handleApi };