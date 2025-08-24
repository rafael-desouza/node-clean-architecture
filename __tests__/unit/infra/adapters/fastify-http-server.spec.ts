/* eslint-disable @typescript-eslint/no-explicit-any */
import Fastify from 'fastify';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeepMockProxy, mockDeep } from 'vitest-mock-extended';

import { DocumentationPort } from '@/core/application/ports/documentation.port';
import { ErrorHandlerPort } from '@/core/application/ports/error-handler.port';
import { HttpMethod } from '@/core/application/ports/http-server-port';
import { LoggerPort } from '@/core/application/ports/logger.port';
import { FastifyHttpServerAdapter } from '@/infra/adapters/http-server/fastify-http-server';

vi.mock('fastify', () => {
  const fastifyInstance = {
    register: vi.fn(),
    setErrorHandler: vi.fn(),
    route: vi.fn(),
    listen: vi.fn(),
    ready: vi.fn(),
  };
  return {
    default: vi.fn(() => fastifyInstance),
  };
});

describe('FastifyHttpServerAdapter', () => {
  let mockLogger: DeepMockProxy<LoggerPort>;
  let mockErrorHandler: DeepMockProxy<ErrorHandlerPort>;
  let mockOpenApi: DeepMockProxy<DocumentationPort>;
  let fastifyHttpServerAdapter: FastifyHttpServerAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger = mockDeep<LoggerPort>();
    mockErrorHandler = mockDeep<ErrorHandlerPort>();
    mockOpenApi = mockDeep<DocumentationPort>();
    fastifyHttpServerAdapter = new FastifyHttpServerAdapter(
      mockLogger,
      mockErrorHandler,
      mockOpenApi
    );
  });

  describe('route', () => {
    it('should log an error and re-throw if the route handler fails', async () => {
      const handlerError = new Error('Handler failed!');
      const mockRoute = {
        method: HttpMethod.GET,
        path: '/fail',
        handler: vi.fn().mockRejectedValue(handlerError),
      };

      fastifyHttpServerAdapter.route(mockRoute);
      const fastifyHandler = (Fastify().route as any).mock.calls[0][0].handler;

      const mockReply = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn(),
      };

      await expect(fastifyHandler({}, mockReply)).rejects.toThrow(handlerError);

      expect(mockLogger.error).toHaveBeenCalledWith(handlerError);
    });
  });

  describe('listen', () => {
    it('should start the server successfully without errors', async () => {
      const mockProcessExit = vi
        .spyOn(process, 'exit')
        .mockImplementation(() => undefined as never);

      (Fastify().listen as any).mockResolvedValue(undefined);

      await fastifyHttpServerAdapter.listen(3000);

      expect(Fastify().listen).toHaveBeenCalledWith({ port: 3000 });
      expect(mockLogger.error).not.toHaveBeenCalled();
      expect(mockProcessExit).not.toHaveBeenCalled();
    });
    it('should log an error and exit if the server fails to start', async () => {
      const listenError = new Error('Address already in use');
      const mockProcessExit = vi
        .spyOn(process, 'exit')
        .mockImplementation(() => undefined as never);

      (Fastify().listen as any).mockRejectedValue(listenError);

      await fastifyHttpServerAdapter.listen(3000);

      expect(mockLogger.error).toHaveBeenCalledWith(listenError.message);
      expect(mockProcessExit).toHaveBeenCalledWith(1);
    });
  });

  describe('Doc', () => {
    it('should init the doc instance', async () => {
      const docInstance = await fastifyHttpServerAdapter.setupSwagger();
      expect(docInstance).toBeUndefined();
    });
  });

  describe('getServer', () => {
    it('should return the fastify instance', () => {
      const serverInstance = fastifyHttpServerAdapter.getServer();
      expect(serverInstance).toBe(Fastify());
    });
  });
});
