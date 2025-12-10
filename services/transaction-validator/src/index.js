const express = require('express');
const logger = require('./logger');
const { client, httpRequestDurationSeconds, httpErrorsTotal, validationsTotal } = require('./metrics');
const { startTracing } = require('./tracing');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const COLOR = process.env.COLOR || 'blue';

startTracing(logger);

function observe(req, res, next) {
  const end = httpRequestDurationSeconds.startTimer({ route: req.path, method: req.method });
  res.on('finish', () => {
    end({ status_code: res.statusCode });
  });
  next();
}

app.use(observe);

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', color: COLOR });
});

app.post('/validate', async (req, res) => {
  const { transactionId, amount } = req.body || {};
  const start = Date.now();
  try {
    if (!transactionId || typeof amount !== 'number') {
      validationsTotal.inc({ status: 'invalid' });
      return res.status(422).json({ error: 'payload inválido' });
    }

    const peakFactor = Number(process.env.PEAK_LATENCY_MS || 0);
    const baseLatency = 50;
    const jitter = Math.random() * 100;
    const latency = baseLatency + jitter + peakFactor;
    await new Promise((r) => setTimeout(r, latency));

    if (Math.random() < Number(process.env.ERROR_RATE || 0)) {
      throw new Error('simulated 500 error');
    }

    validationsTotal.inc({ status: 'ok' });
    const duration = Date.now() - start;
    logger.info({ msg: 'validated', transactionId, amount, duration_ms: duration, color: COLOR });
    return res.status(200).json({ ok: true, transactionId, latency_ms: duration });
  } catch (err) {
    httpErrorsTotal.inc({ route: '/validate' });
    logger.error({ err, transactionId }, 'Error en validación');
    return res.status(500).json({ error: 'internal error' });
  }
});

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info({ msg: 'Transaction-Validator iniciado', port: PORT, color: COLOR });
  });
}

module.exports = app;
