FROM node:18-alpine AS base
WORKDIR /app
COPY package.json .
RUN npm install --production
COPY src ./src
ENV PORT=8080
ENV OTEL_SERVICE_NAME=transaction-validator
ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318
EXPOSE 8080
CMD ["node", "src/index.js"]
