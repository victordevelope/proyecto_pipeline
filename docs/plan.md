# Proyecto: Pipeline CD, Despliegue y Observabilidad para Transaction-Validator

## Arquitectura del pipeline
- Herramienta: GitHub Actions (self-hosted para despliegue).
- Etapas: build, pruebas, empaquetado Docker, despliegue Blue/Green, validación y rollback.

## Estrategia de despliegue
- Blue/Green con NGINX como reverse proxy.
- Cero downtime: se enruta tráfico al color activo y se conmutan upstreams tras health y smoke test.
- Rollback automático si falla la validación post-despliegue.

## SLA / SLO / SLI y presupuesto de errores
- SLA: 99.5% mensual.
- SLO: Disponibilidad 99.7%; Latencia p95 < 250ms; Tasa de errores 5xx < 0.8%.
- SLI: Disponibilidad (tasa de respuestas 2xx/3xx), Latencia p95/p99, Error rate 5xx, Uso CPU/memoria (tv_process_*), RPS.
- Presupuesto de errores: para 99.7% mensual (~43200 min), error budget ≈ 0.3% ≈ 130 min.

## Configuración del entorno
- `docker-compose.yml` levanta microservicio en Blue y Green, NGINX, Prometheus, Grafana, Loki/Promtail, Jaeger.
- Métricas expuestas en `/metrics` vía `prom-client`. Logs JSON con `pino`. Trazas con OpenTelemetry hacia Jaeger.

## Diagramas (descripción textual)
- Pipeline: Push→Build/Test→Deploy Blue/Green→Health→Switch→Smoke→Rollback si falla.
- Flujo despliegue: Activar color inactivo→Probar→Cambiar NGINX→Validar→Retirar color antiguo.
- Monitoreo: Prometheus scrapea Blue/Green; Grafana dashboard; Loki recoge logs; Jaeger UI para trazas.

## Resultados y análisis (plantilla)
- Antes/después del despliegue: comparar p95 latencia, error rate y RPS.
- Bottlenecks: revisar picos de latencia en horas pico con `PEAK_LATENCY_MS`.
- Errores relevantes: correlacionar logs de `pino` con trazas (traceId) y métricas.

## Plan de mejora
- Optimizar consultas/validaciones que exceden p95.
- Ajustar `ERROR_RATE` y circuit breakers.
- Mejorar pipeline: paralelizar pruebas, cachear dependencias.
- Infraestructura: horizontal scaling, autoscaling basado en SLO.
- Métricas futuras: colas internas, dependencia externa, saturación de CPU.

