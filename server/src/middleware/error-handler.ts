import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { isAppError } from '../errors/index.js';
import { failure } from '../utils/response.js';

/**
 * Central error handler. Registered once on the Fastify instance so that no
 * route handler ever has to shape an error response itself.
 *
 * Mapping:
 *  - AppError subclasses  -> their own statusCode/code, message is safe to show.
 *  - ZodError             -> 400 VALIDATION_ERROR.
 *  - Fastify 4xx errors   -> passed through with their statusCode.
 *  - Anything else        -> 500 INTERNAL_ERROR with a generic message; the
 *                            real error is logged, never leaked to the client.
 */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    if (isAppError(error)) {
      if (!error.isOperational) {
        request.log.error({ err: error, details: error.details }, error.message);
      } else {
        request.log.warn({ code: error.code, details: error.details }, error.message);
      }
      return reply.status(error.statusCode).send(failure(error.code, error.message));
    }

    if (error instanceof ZodError) {
      const message = error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; ');
      request.log.warn({ issues: error.issues }, 'request validation failed');
      return reply.status(400).send(failure('VALIDATION_ERROR', message));
    }

    // Fastify's own errors (e.g. 404 route not found, 400 bad JSON) carry a
    // statusCode. Honor client errors; treat anything >= 500 as internal.
    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 400 && statusCode < 500) {
      request.log.warn({ err: error }, error.message);
      return reply
        .status(statusCode)
        .send(failure(error.code ?? 'BAD_REQUEST', error.message));
    }

    request.log.error({ err: error }, 'unhandled internal error');
    return reply
      .status(500)
      .send(failure('INTERNAL_ERROR', 'An unexpected error occurred.'));
  });
}
