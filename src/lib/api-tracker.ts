import { NextRequest, NextResponse } from 'next/server';
import { trackApiCall as analyticsTrackApiCall, logError as analyticsLogError } from './analytics-store';

type RouteHandler = (request: Request | NextRequest, ...args: any[]) => Promise<Response | NextResponse>;
type ApiHandler = (...args: any[]) => Promise<any>;

export function logApiCall(endpoint: string, duration: number): void {
  analyticsTrackApiCall(endpoint, true, duration);
}

export function logError(endpoint: string, error: string): void {
  analyticsLogError(endpoint, error);
}

export function withApiTracking(endpoint: string, handler: ApiHandler): ApiHandler {
  return async (...args: any[]) => {
    const startTime = Date.now();
    try {
      const result = await handler(...args);
      await logApiCall(endpoint, Date.now() - startTime);
      return result;
    } catch (error) {
      await logError(endpoint, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  };
}

// Export a higher-order function for route handlers
export function withRouteTracking(endpoint: string, handler: RouteHandler): RouteHandler {
  return withApiTracking(endpoint, handler) as RouteHandler;
}
