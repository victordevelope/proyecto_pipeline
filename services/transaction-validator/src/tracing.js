async function startTracing(logger) {
  try {
    const { NodeSDK } = require('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
    const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

    const exporter = new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318'
    });

    const sdk = new NodeSDK({
      traceExporter: exporter,
      instrumentations: [getNodeAutoInstrumentations()]
    });
    await sdk.start();
    logger.info({ msg: 'Tracing iniciado', endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT });
  } catch (err) {
    logger.warn({ err: String(err) }, 'Tracing no habilitado (dependencias no instaladas)');
  }
}

module.exports = { startTracing };
