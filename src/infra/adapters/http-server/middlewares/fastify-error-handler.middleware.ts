import { ZodError } from 'zod';

import { HttpError } from '@/core/application/object-values/error/http-error.error';
import { ErrorHandlerPort } from '@/core/application/ports/error-handler.port';
import { LoggerPort } from '@/core/application/ports/logger.port';

export class FastifyErrorHandlerMiddleware implements ErrorHandlerPort {
  constructor(private readonly logger: LoggerPort) {}

  handle(
    error: unknown,
    sendResponse: (status: number, body: unknown) => void
  ) {
    if (error instanceof ZodError) {
      sendResponse(422, {
        status: 'error',
        message: 'Validation error',
        errors: error.issues.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        })),
      });
      return;
    }

    if (error instanceof HttpError) {
      sendResponse(error.statusCode, {
        status: 'error',
        message: error.message,
        info: error.data,
      });

      return;
    }

    this.logger.error('Internal Error server', { error });
    sendResponse(500, {
      status: 'error',
      message: 'Internal server error',
    });
  }
}
