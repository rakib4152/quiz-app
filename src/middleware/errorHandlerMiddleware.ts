import { RequestContext } from '../types/architecture';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  correlationId: string;
  timestamp: string;
}

/**
 * Standard RFC 7807 Problem Details error handler
 */
export function formatProblemDetails(
  status: number,
  title: string,
  detail: string,
  ctx?: RequestContext
): ProblemDetails {
  return {
    type: `https://api.exampro.ai/errors/${status}`,
    title,
    status,
    detail,
    instance: `/api/v1/context`,
    correlationId: ctx?.correlationId || `cid-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
}
