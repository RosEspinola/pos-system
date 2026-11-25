// server.js
// A small web server made with Node's built-in "http" module.
// It does two jobs:
//   1. Sends the website files (HTML, CSS, JS) from the /public folder.
//   2. Answers API requests from the website (products, checkout, sales).
// Run it with:  npm start   then open http://localhost:3000

const http = require('http');
const fs = require('fs');
const path = require('path');
const products = require('./products');
const sales = require('./sales');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// ---------- helpers ----------
function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

// Reads the JSON that the website sends us
function readBody(req) {
  return new Promise((resolve, reject) => {
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

// ---------- API ----------
async function handleApi(req, res, pathname) {
  const method = req.method;

  try {
    // GET /api/products -> list all products
    if (pathname === '/api/products' && method === 'GET') {
      return sendJSON(res, 200, products.getAll());
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
      return sendJSON(res, 201, products.add(cleanName, priceNumber, stockNumber));
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
        if (!products.changeStock(id, amountNumber)) {
          return sendJSON(res, 404, { error: 'Product not found.' });
        }
        return sendJSON(res, 200, products.findById(id));
      }

      if (!match[2] && method === 'DELETE') {
        if (!products.remove(id)) {
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

      const lines = [];
      for (const id of Object.keys(wanted)) {
        const product = products.findById(Number(id));
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
      lines.forEach((line) => products.changeStock(line.id, -line.qty)); // lower the stock
      const sale = sales.save(lines, total, paidNumber, change);
      return sendJSON(res, 201, sale);
    }

    // GET /api/sales -> sales report
    if (pathname === '/api/sales' && method === 'GET') {
      return sendJSON(res, 200, {
        summary: sales.getSummary(),
        sales: sales.getAll().reverse(), // newest first
      });
    }

    sendJSON(res, 404, { error: 'Not found.' });
  } catch (err) {
    sendJSON(res, 400, { error: err.message });
  }
}

// ---------- website files ----------
function serveStatic(res, pathname) {
  const fileName = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, fileName));

  // Safety: do not allow files outside the /public folder
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 - Page not found');
    }
    const type = MIME_TYPES[path.extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(content);
  });
}

// ---------- start the server ----------
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;

  if (pathname.startsWith('/api/')) {
    handleApi(req, res, pathname);
  } else {
    serveStatic(res, pathname);
  }
});

server.listen(PORT, () => {
  console.log(`POS website is running at http://localhost:${PORT}`);
  console.log('Press Ctrl + C to stop.');
});
