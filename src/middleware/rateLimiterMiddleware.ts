import { RequestContext, MiddlewareResult } from '../types/architecture';

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, TokenBucket>();
const MAX_TOKENS = 60; // 60 requests
const REFILL_RATE_MS = 1000; // 1 token per second

/**
 * Token-Bucket Rate Limiter per IP / User
 */
export function rateLimiterMiddleware(
  req: { ip?: string; headers: Record<string, string> },
  ctx: RequestContext
): MiddlewareResult {
  const identifier = ctx.auth?.user?.sub || req.ip || 'client-ip-default';
  const now = Date.now();

  let bucket = buckets.get(identifier);
  if (!bucket) {
    bucket = { tokens: MAX_TOKENS, lastRefill: now };
    buckets.set(identifier, bucket);
  } else {
    // Refill tokens
    const elapsed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(elapsed / REFILL_RATE_MS);
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }
  }

  if (bucket.tokens <= 0) {
    return {
      proceed: false,
      statusCode: 429,
      errorMessage: 'Too Many Requests: Rate limit exceeded. Try again in a few seconds.',
      headers: {
        'X-RateLimit-Limit': MAX_TOKENS.toString(),
        'X-RateLimit-Remaining': '0',
        'Retry-After': '5',
      },
    };
  }

  bucket.tokens--;

  return {
    proceed: true,
    headers: {
      'X-RateLimit-Limit': MAX_TOKENS.toString(),
      'X-RateLimit-Remaining': bucket.tokens.toString(),
    },
  };
}
