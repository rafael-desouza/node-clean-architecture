import fastifyCookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import Fastify, {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from 'fastify';
import { OpenAPIV3 } from 'openapi-types';

import { DocumentationPort } from '@/core/application/ports/documentation.port';
import { ErrorHandlerPort } from '@/core/application/ports/error-handler.port';
import {
  HttpRoute,
  HttpServerPort,
  RequestContext,
} from '@/core/application/ports/http-server-port';
import { LoggerPort } from '@/core/application/ports/logger.port';

export class FastifyHttpServerAdapter implements HttpServerPort {
  private server: FastifyInstance;

  constructor(
    private readonly logger: LoggerPort,
    private readonly errorHandler: ErrorHandlerPort,
    private readonly openApi: DocumentationPort
  ) {
    this.server = Fastify({ logger: true });
    this.server.register(fastifyCookie);

    this.server.register(cors, { origin: '*' });
    this.server.register(helmet);
    this.server.register(multipart, { attachFieldsToBody: 'keyValues' });

    this.server.setErrorHandler(
      (error, request: FastifyRequest, reply: FastifyReply) => {
        this.errorHandler.handle(error, (status, body) =>
          reply.status(status).send(body)
        );
      }
    );
  }

  route(route: HttpRoute): void {
    this.server.route({
      method: route.method,
      url: route.path,
      preHandler: route.middleware?.map((appMiddleware) => {
        return async (request: FastifyRequest, _reply: FastifyReply) => {
          const context = this.createRequestContext(request);
          await appMiddleware(context);
        };
      }),
      handler: async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          this.logger.info('Request received', {
            method: request.method,
            url: request.url,
            headers: request.headers,
          });

          const context = this.createRequestContext(request);
          const body = await context.getBody<Record<string, unknown>>();
          const params = context.getParams();
          const query = await context.getQuery<Record<string, unknown>>();
          const cookies = context.getCookies();
          const headers = context.getHeaders();

          const response = await route.handler(
            body,
            params,
            query,
            headers,
            cookies
          );

          const statusCode = route.successStatusCode || 200;
          reply.status(statusCode).send(response);
        } catch (error) {
          this.logger.error(error);
          throw error;
        }
      },
    });

    this.openApi.addRoute(route);
  }

  async listen(port: number): Promise<void> {
    try {
      await this.server.listen({ port });
    } catch (err) {
      this.logger.error((err as Error).message);
      process.exit(1);
    }
  }

  getServer(): FastifyInstance {
    return this.server;
  }

  private createRequestContext(request: FastifyRequest): RequestContext {
    return {
      getParams: () => request.params as Record<string, unknown>,
      getHeaders: () => request.headers as Record<string, unknown>,
      getCookies: () => request.cookies as Record<string, unknown>,
      getQuery: <T>() => Promise.resolve(request.query as T),
      getBody: <T>() => Promise.resolve(request.body as T),
      setData: (key: string, value: unknown) => {
        const headers = { ...request.headers, [key]: value };
        Object.assign(request.headers, headers);
      },
      getData: <T>(key: string) => request.headers[key] as T,
    };
  }

  async setupSwagger() {
    await this.server.register(fastifySwagger, {
      openapi: this.openApi.generateSpec() as OpenAPIV3.Document,
    });
    await this.server.register(fastifySwaggerUi, {
      routePrefix: '/docs',
    });
  }
}
