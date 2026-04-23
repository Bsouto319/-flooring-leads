const logger = require('../utils/logger');
const { handleError } = require('./alerting');

function errorHandler(err, req, res, next) {
  logger.error('http', err.message, err.stack);
  handleError('http', err).catch(() => {});
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = errorHandler;
