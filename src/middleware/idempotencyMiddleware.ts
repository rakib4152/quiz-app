import { RequestContext, MiddlewareResult } from '../types/architecture';

const seenKeys = new Map<string, { timestamp: number; responseData?: any }>();

/**
 * Validates Idempotency-Key header on mutating operations
 */
export function idempotencyMiddleware(
  req: { method: string; headers: Record<string, string> },
  ctx: RequestContext
): MiddlewareResult {
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());
  if (!isMutation) {
    return { proceed: true };
  }

  const idempotencyKey = req.headers['idempotency-key'] || req.headers['Idempotency-Key'];
  if (!idempotencyKey) {
    // If not required by all endpoints, we simply pass through
    return { proceed: true };
  }

  ctx.idempotencyKey = idempotencyKey;

  const existing = seenKeys.get(idempotencyKey);
  if (existing) {
    return {
      proceed: true,
      headers: {
        'X-Cache-Lookup': 'HIT_IDEMPOTENT_REPLAY',
      },
    };
  }

  seenKeys.set(idempotencyKey, { timestamp: Date.now() });

  return {
    proceed: true,
    headers: {
      'X-Cache-Lookup': 'MISS',
    },
  };
}
