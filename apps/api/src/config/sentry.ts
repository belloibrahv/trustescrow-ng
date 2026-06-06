// apps/api/src/config/sentry.ts
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { prismaIntegration } from '@sentry/node';
import { env } from './env';
import { prisma } from '../db/prisma';

/**
 * Initialize Sentry for error tracking and performance monitoring
 * Only active if SENTRY_DSN is configured in environment
 */
export function initSentry(): void {
  if (!env.SENTRY_DSN) {
    console.log('⚠️  Sentry DSN not configured - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    
    // Performance Monitoring
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
    profilesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Integrations
    integrations: [
      // HTTP request tracing
      Sentry.httpIntegration({ tracing: true }),
      
      // Prisma query tracking
      prismaIntegration({ client: prisma }),
      
      // Node profiling
      nodeProfilingIntegration(),
    ],
    
    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }
      
      // Remove phone numbers from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (breadcrumb.data?.phone) {
            breadcrumb.data.phone = '[REDACTED]';
          }
          return breadcrumb;
        });
      }
      
      return event;
    },
    
    // Ignore expected errors
    ignoreErrors: [
      'Invalid token',
      'Unauthorized',
      'Too Many Requests',
      'ECONNREFUSED', // Redis connection during startup
    ],
  });

  console.log(`✅ Sentry initialized for ${env.NODE_ENV} environment`);
}

/**
 * Capture exception with additional context
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (env.SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}

/**
 * Set user context for error tracking
 */
export function setUserContext(userId: string, phone?: string): void {
  if (env.SENTRY_DSN) {
    Sentry.setUser({
      id: userId,
      username: phone ? `[REDACTED]` : undefined, // Don't send PII to Sentry
    });
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
): void {
  if (env.SENTRY_DSN) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    });
  }
}

/**
 * Track custom transaction
 */
export function startTransaction(name: string, op: string): any {
  if (env.SENTRY_DSN) {
    return Sentry.startTransaction({ name, op });
  }
  return null;
}
