import { RequestContext, MiddlewareResult } from '../types/architecture';

/**
 * Generates and propagates unique X-Correlation-ID for distributed microservices tracing
 */
export function correlationIdMiddleware(
  req: { headers: Record<string, string> },
  ctx: RequestContext
): MiddlewareResult {
  const incoming = req.headers['x-correlation-id'] || req.headers['X-Correlation-ID'];
  const correlationId = incoming || `cid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  ctx.correlationId = correlationId;

  return {
    proceed: true,
    headers: {
      'X-Correlation-ID': correlationId,
    },
  };
}
