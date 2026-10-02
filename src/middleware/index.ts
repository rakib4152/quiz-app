import { RequestContext, MiddlewareResult } from '../types/architecture';
import { correlationIdMiddleware } from './correlationIdMiddleware';
import { auth0Middleware } from './auth0Middleware';
import { rateLimiterMiddleware } from './rateLimiterMiddleware';
import { idempotencyMiddleware } from './idempotencyMiddleware';
import { requireRole, requirePermission } from './rbacMiddleware';
import { formatProblemDetails, ProblemDetails } from './errorHandlerMiddleware';

export {
  correlationIdMiddleware,
  auth0Middleware,
  rateLimiterMiddleware,
  idempotencyMiddleware,
  requireRole,
  requirePermission,
  formatProblemDetails,
};

export type MiddlewareHandler = (req: any, ctx: RequestContext) => MiddlewareResult;

/**
 * Runs a sequence of middlewares against an incoming request
 */
export function runMiddlewarePipeline(
  req: { method: string; headers: Record<string, string>; ip?: string },
  customMiddlewares: MiddlewareHandler[] = []
): { passed: boolean; ctx: RequestContext; errorResponse?: ProblemDetails; responseHeaders: Record<string, string> } {
  const ctx: RequestContext = {
    correlationId: '',
    startTime: performance.now(),
    ip: req.ip || '127.0.0.1',
    userAgent: req.headers['user-agent'] || 'ExamPro-Client',
  };

  const responseHeaders: Record<string, string> = {};

  const pipeline: MiddlewareHandler[] = [
    correlationIdMiddleware,
    rateLimiterMiddleware,
    auth0Middleware,
    idempotencyMiddleware,
    ...customMiddlewares,
  ];

  for (const mw of pipeline) {
    const res = mw(req, ctx);
    if (res.headers) {
      Object.assign(responseHeaders, res.headers);
    }
    if (!res.proceed) {
      const status = res.statusCode || 400;
      const errorResponse = formatProblemDetails(
        status,
        status === 401 ? 'Unauthorized' : status === 403 ? 'Forbidden' : 'Request Error',
        res.errorMessage || 'An error occurred during request processing.',
        ctx
      );
      return { passed: false, ctx, errorResponse, responseHeaders };
    }
  }

  return { passed: true, ctx, responseHeaders };
}
