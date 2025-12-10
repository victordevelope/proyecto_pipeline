const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { service: process.env.OTEL_SERVICE_NAME || 'transaction-validator', color: process.env.COLOR || 'blue' }
});

module.exports = logger;
