const client = require('prom-client');

client.collectDefaultMetrics({ prefix: 'tv_', timeout: 5000 });

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duración de solicitudes HTTP en segundos',
  labelNames: ['route', 'method', 'status_code'],
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5]
});

const httpErrorsTotal = new client.Counter({
  name: 'http_errors_total',
  help: 'Conteo de errores HTTP 5xx',
  labelNames: ['route']
});

const validationsTotal = new client.Counter({
  name: 'validations_total',
  help: 'Total de validaciones procesadas',
  labelNames: ['status']
});

module.exports = { client, httpRequestDurationSeconds, httpErrorsTotal, validationsTotal };
