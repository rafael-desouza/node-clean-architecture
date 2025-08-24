import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeepMockProxy, mockDeep } from 'vitest-mock-extended';
import { ZodError } from 'zod';

import { HttpError } from '@/core/application/object-values/error/http-error.error';
import { LoggerPort } from '@/core/application/ports/logger.port';
import { FastifyErrorHandlerMiddleware } from '@/infra/adapters/http-server/middlewares/fastify-error-handler.middleware';

describe('FastifyErrorHandlerMiddleware', () => {
  let mockLogger: DeepMockProxy<LoggerPort>;
  let errorHandler: FastifyErrorHandlerMiddleware;
  let mockSendResponse: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockLogger = mockDeep<LoggerPort>();
    mockSendResponse = vi.fn();
    errorHandler = new FastifyErrorHandlerMiddleware(mockLogger);
  });

  it('should handle a ZodError and send a 422 response', () => {
    const zodError = new ZodError([
      {
        code: 'invalid_value',
        path: ['email'],
        message: 'Invalid email',
        values: ['invalid'],
      },
    ]);

    errorHandler.handle(zodError, mockSendResponse);

    expect(mockSendResponse).toHaveBeenCalledWith(422, expect.any(Object));
  });

  it('should handle an HttpError and send a response with its status code', () => {
    const httpError = new HttpError('Not found', 404);

    errorHandler.handle(httpError, mockSendResponse);

    expect(mockSendResponse).toHaveBeenCalledWith(404, expect.any(Object));
  });

  it('should handle a generic Error and send a 500 response', () => {
    const genericError = new Error('Something unexpected broke!');

    errorHandler.handle(genericError, mockSendResponse);

    expect(mockLogger.error).toHaveBeenCalledWith('Internal Error server', {
      error: genericError,
    });

    expect(mockSendResponse).toHaveBeenCalledWith(500, {
      status: 'error',
      message: 'Internal server error',
    });
  });
});
