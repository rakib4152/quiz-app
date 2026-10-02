import { RequestContext, MiddlewareResult } from '../types/architecture';

/**
 * Enforces Role-Based Access Control (RBAC) and Scopes/Permissions
 */
export function requireRole(allowedRoles: string[]) {
  return (_req: any, ctx: RequestContext): MiddlewareResult => {
    if (!ctx.auth?.isAuthenticated) {
      return {
        proceed: false,
        statusCode: 401,
        errorMessage: 'Authentication required to access this resource.',
      };
    }

    const userRoles = ctx.auth.roles || [];
    const hasRole = allowedRoles.some((r) => userRoles.includes(r));

    if (!hasRole) {
      return {
        proceed: false,
        statusCode: 403,
        errorMessage: `Forbidden: User role [${userRoles.join(', ')}] lacks required role [${allowedRoles.join(', ')}].`,
      };
    }

    return { proceed: true };
  };
}

/**
 * Enforces specific Auth0 Permission Scope
 */
export function requirePermission(permission: string) {
  return (_req: any, ctx: RequestContext): MiddlewareResult => {
    if (!ctx.auth?.isAuthenticated) {
      return {
        proceed: false,
        statusCode: 401,
        errorMessage: 'Authentication required to perform this action.',
      };
    }

    const permissions = ctx.auth.permissions || [];
    if (!permissions.includes(permission)) {
      return {
        proceed: false,
        statusCode: 403,
        errorMessage: `Forbidden: Missing required permission scope: ${permission}.`,
      };
    }

    return { proceed: true };
  };
}
