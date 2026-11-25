// server.js
// A small web server for running the POS on YOUR computer.
// It does two jobs:
//   1. Sends the website files (HTML, CSS, JS) from the /public folder.
//   2. Sends API requests to api.js.
// Run it with:  npm start   then open http://localhost:3000
// (On Vercel this file is not used. Vercel uses api/[...path].js instead.)

const http = require('http');
const fs = require('fs');
const path = require('path');
const { handleApi } = require('./api');

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
