// api/[...path].js
// This is the file Vercel runs for every /api/... request.
// The name [...path] means "any path after /api/".
// All the real work is done in src/api.js.

const { handleApi } = require('../src/api');

module.exports = async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  await handleApi(req, res, pathname);
};
