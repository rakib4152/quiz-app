import {
  MicroserviceId,
  ServiceHealth,
  MicroserviceRequest,
  MicroserviceResponse
} from '../../types/architecture';

class ServiceRegistry {
  private services: Map<MicroserviceId, ServiceHealth> = new Map();

  constructor() {
    this.initDefaultServices();
  }

  private initDefaultServices() {
    const list: ServiceHealth[] = [
      {
        serviceId: 'auth-service',
        name: 'Auth0 Identity & RBAC Service',
        port: 4001,
        status: 'HEALTHY',
        uptimeSeconds: 142900,
        circuitState: 'CLOSED',
        requestCount: 3824,
        errorCount: 2,
        avgLatencyMs: 14.2,
        lastHeartbeat: new Date().toISOString(),
      },
      {
        serviceId: 'quiz-service',
        name: 'Quiz & Exam Execution Engine',
        port: 4002,
        status: 'HEALTHY',
        uptimeSeconds: 142900,
        circuitState: 'CLOSED',
        requestCount: 9410,
        errorCount: 6,
        avgLatencyMs: 22.8,
        lastHeartbeat: new Date().toISOString(),
      },
      {
        serviceId: 'payment-service',
        name: 'Payment & Ledger Microservice (bKash/Nagad)',
        port: 4003,
        status: 'HEALTHY',
        uptimeSeconds: 142900,
        circuitState: 'CLOSED',
        requestCount: 1250,
        errorCount: 1,
        avgLatencyMs: 45.6,
        lastHeartbeat: new Date().toISOString(),
      },
      {
        serviceId: 'search-service',
        name: 'Elasticsearch Index & Query Service',
        port: 4004,
        status: 'HEALTHY',
        uptimeSeconds: 142900,
        circuitState: 'CLOSED',
        requestCount: 6890,
        errorCount: 0,
        avgLatencyMs: 3.4,
        lastHeartbeat: new Date().toISOString(),
      },
      {
        serviceId: 'analytics-service',
        name: 'Kafka + Flink Streaming Analytics',
        port: 4005,
        status: 'HEALTHY',
        uptimeSeconds: 142900,
        circuitState: 'CLOSED',
        requestCount: 18450,
        errorCount: 3,
        avgLatencyMs: 6.1,
        lastHeartbeat: new Date().toISOString(),
      },
    ];

    list.forEach((s) => this.services.set(s.serviceId, s));
  }

  public getServices(): ServiceHealth[] {
    return Array.from(this.services.values()).map((s) => ({
      ...s,
      lastHeartbeat: new Date().toISOString(),
    }));
  }

  public getService(id: MicroserviceId): ServiceHealth | undefined {
    return this.services.get(id);
  }

  /**
   * Route request to target microservice with circuit breaker protection
   */
  public async dispatch<TReq = any, TRes = any>(
    request: MicroserviceRequest<TReq>
  ): Promise<MicroserviceResponse<TRes>> {
    const service = this.services.get(request.targetService);
    if (!service) {
      return {
        correlationId: request.correlationId,
        statusCode: 503,
        error: { code: 'SERVICE_NOT_FOUND', message: `Target service ${request.targetService} not registered` },
        durationMs: 0,
        servedBy: request.targetService,
      };
    }

    // Circuit Breaker Check
    if (service.circuitState === 'OPEN') {
      return {
        correlationId: request.correlationId,
        statusCode: 503,
        error: { code: 'CIRCUIT_OPEN', message: `Circuit breaker OPEN for ${service.name}. Call rejected.` },
        durationMs: 1,
        servedBy: request.targetService,
      };
    }

    const start = performance.now();
    service.requestCount++;

    // Simulated network hop & microservice processing
    const latency = Math.round(service.avgLatencyMs + (Math.random() * 8 - 4));
    const duration = Math.max(2, latency);

    return {
      correlationId: request.correlationId,
      statusCode: 200,
      data: request.body as any,
      durationMs: duration,
      servedBy: request.targetService,
    };
  }

  /**
   * Simulate trip circuit breaker for testing resilience
   */
  public toggleCircuitBreaker(id: MicroserviceId) {
    const s = this.services.get(id);
    if (s) {
      s.circuitState = s.circuitState === 'CLOSED' ? 'OPEN' : 'CLOSED';
    }
  }
}

export const serviceRegistry = new ServiceRegistry();
