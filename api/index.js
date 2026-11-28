const { handleApi } = require('../src/api');

module.exports = async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const rewrittenPath = url.searchParams.get('path');

  const pathname =
    rewrittenPath !== null
      ? '/api/' + rewrittenPath.replace(/^\/+/, '')
      : url.pathname;

  await handleApi(req, res, pathname);
};