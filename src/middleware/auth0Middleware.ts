import { RequestContext, MiddlewareResult } from '../types/architecture';
import { verifyAndDecodeAuth0Token } from '../services/auth0/auth0Service';

/**
 * Validates Auth0 Bearer token in Authorization header
 */
export function auth0Middleware(
  req: { headers: Record<string, string> },
  ctx: RequestContext
): MiddlewareResult {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader) {
    ctx.auth = {
      isAuthenticated: false,
      roles: ['ANONYMOUS'],
      permissions: [],
    };
    return { proceed: true };
  }

  if (!authHeader.startsWith('Bearer ')) {
    return {
      proceed: false,
      statusCode: 401,
      errorMessage: 'Invalid Authorization header format. Expected Bearer <token>.',
    };
  }

  const token = authHeader.substring(7).trim();
  const verification = verifyAndDecodeAuth0Token(token);

  if (!verification.isValid || !verification.payload) {
    return {
      proceed: false,
      statusCode: 401,
      errorMessage: verification.error || 'Unauthorized: Token validation failed.',
    };
  }

  ctx.auth = {
    isAuthenticated: true,
    token,
    roles: verification.payload.roles || ['STUDENT'],
    permissions: verification.payload.permissions || [],
  };

  return { proceed: true };
}
