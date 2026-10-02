import {
  MicroserviceId,
  ServiceHealth,
  MicroserviceRequest,
  MicroserviceResponse
} from '../types/architecture';

class ServiceRegistry {
  private services: Map<MicroserviceId, ServiceHealth> = new Map();

  constructor() {
    this.initDefaultServices();
  }

  private initDefaultServices() {
    const list: ServiceHealth[] = [
      {
        serviceId: 'user-service',
        name: 'User Identity & Subscription Microservice',
        port: 4001,
        status: 'HEALTHY',
        uptimeSeconds: 142900,
        circuitState: 'CLOSED',
        requestCount: 4210,
        errorCount: 1,
        avgLatencyMs: 11.4,
        lastHeartbeat: new Date().toISOString(),
      },
      {
        serviceId: 'question-service',
        name: 'Question Bank & Item Banking Microservice',
        port: 4002,
        status: 'HEALTHY',
        uptimeSeconds: 142900,
        circuitState: 'CLOSED',
        requestCount: 8150,
        errorCount: 2,
        avgLatencyMs: 8.7,
        lastHeartbeat: new Date().toISOString(),
      },
      {
        serviceId: 'quiz-service',
        name: 'Quiz & Exam Execution Engine',
        port: 4003,
        status: 'HEALTHY',
        uptimeSeconds: 142900,
        circuitState: 'CLOSED',
        requestCount: 11340,
        errorCount: 5,
        avgLatencyMs: 18.2,
        lastHeartbeat: new Date().toISOString(),
      },
      {
        serviceId: 'payment-service',
        name: 'Payment & Ledger Microservice (bKash/Nagad/Rocket)',
        port: 4004,
        status: 'HEALTHY',
        uptimeSeconds: 142900,
        circuitState: 'CLOSED',
        requestCount: 1890,
        errorCount: 1,
        avgLatencyMs: 42.5,
        lastHeartbeat: new Date().toISOString(),
      },
      {
        serviceId: 'search-service',
        name: 'Elasticsearch Index & Query Service',
        port: 4005,
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
        name: 'Kafka + Flink Streaming Analytics Engine',
        port: 4006,
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
        error: { code: 'SERVICE_NOT_FOUND', message: `Service ${request.targetService} is not registered` },
        durationMs: 0,
        servedBy: request.targetService,
      };
    }

    if (service.circuitState === 'OPEN') {
      return {
        correlationId: request.correlationId,
        statusCode: 503,
        error: { code: 'CIRCUIT_BREAKER_OPEN', message: `Service ${service.name} circuit breaker is OPEN` },
        durationMs: 1.2,
        servedBy: service.serviceId,
      };
    }

    service.requestCount++;
    const start = performance.now();

    await new Promise((r) => setTimeout(r, Math.random() * 20 + 5));
    const durationMs = Math.round((performance.now() - start) * 10) / 10;

    return {
      correlationId: request.correlationId,
      statusCode: 200,
      data: { acknowledged: true, routedTo: service.name } as any,
      durationMs,
      servedBy: service.serviceId,
    };
  }

  public toggleCircuitBreaker(id: MicroserviceId) {
    const s = this.services.get(id);
    if (!s) return;
    s.circuitState = s.circuitState === 'CLOSED' ? 'OPEN' : 'CLOSED';
  }
}

export const serviceRegistry = new ServiceRegistry();
