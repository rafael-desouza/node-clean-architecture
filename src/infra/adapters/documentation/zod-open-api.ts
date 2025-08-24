/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  extendZodWithOpenApi,
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from '@asteasolutions/zod-to-openapi';
import {
  ResponseConfig,
  RouteParameter,
} from '@asteasolutions/zod-to-openapi/dist/openapi-registry';
import { OpenAPIV3 } from 'openapi-types';
import { z, ZodType } from 'zod';

import { DocumentationPort } from '@/core/application/ports/documentation.port';
import { HttpRoute } from '@/core/application/ports/http-server-port';

extendZodWithOpenApi(z);

const SuccessResponseSchema = z.object({ success: z.boolean() }).meta({
  title: 'SuccessResponse',
  description: 'Resposta de sucesso padrão',
});

type RequestPart = 'body' | 'query' | 'params' | 'headers' | 'cookies';
type RequestRouteConfig = { [key in RequestPart]?: any };

export class ZodOpenApiDocumentation implements DocumentationPort<ZodType> {
  private registry = new OpenAPIRegistry();

  addRoute(route: HttpRoute<ZodType>): void {
    const request = this.buildRequest(route);
    const responses = this.buildResponses(route);

    this.registry.registerPath({
      method: route.method,
      path: route.path,
      summary: route.schema?.summary,
      description: route.schema?.description,
      tags: route.schema?.tags,
      request,
      responses,
    });
  }

  private buildRequest(
    route: HttpRoute<ZodType>
  ): RequestRouteConfig | undefined {
    const request: RequestRouteConfig = {};
    const schemaParts: [keyof RequestRouteConfig, ZodType | undefined][] = [
      ['body', route.schema?.bodySchema],
      ['query', route.schema?.querySchema],
      ['params', route.schema?.paramsSchema],
      ['headers', route.schema?.headersSchema],
      ['cookies', route.schema?.cookiesSchema],
    ] as const;

    const sanitizedPath = this.sanitizePath(route.path);

    for (const [type, schema] of schemaParts) {
      if (!schema) continue;

      const fallbackTitle = `${route.method}_${sanitizedPath}_${type}`;
      const { schema: processedSchema, schemaName } = this.handleSchema(
        schema,
        fallbackTitle
      );

      this.registry.register(schemaName, processedSchema);

      if (type === 'body') {
        request.body = {
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/${schemaName}` },
            },
          },
        };
      } else {
        request[type] = processedSchema as RouteParameter;
      }
    }

    return Object.keys(request).length > 0 ? request : undefined;
  }

  private buildResponses(route: HttpRoute<ZodType>) {
    const responses = route.schema?.responses || { 200: SuccessResponseSchema };
    const formattedResponses: Record<
      number,
      {
        description: string;
        content: { 'application/json': { schema: unknown } };
      }
    > = {};
    const sanitizedPath = this.sanitizePath(route.path);

    for (const [statusCode, schema] of Object.entries(responses)) {
      const fallbackTitle = `${route.method}_${sanitizedPath}_response_${statusCode}`;
      const { schema: processedSchema, schemaName } = this.handleSchema(
        schema,
        fallbackTitle
      );

      this.registry.register(schemaName, processedSchema);

      formattedResponses[Number(statusCode)] = {
        description: this.getStatusCodeDescription(Number(statusCode)),
        content: {
          'application/json': {
            schema: { $ref: `#/components/schemas/${schemaName}` },
          },
        },
      };
    }

    return formattedResponses as Record<string, ResponseConfig>;
  }

  private handleSchema(
    schema: ZodType<unknown, unknown, any>,
    fallbackTitle: string
  ) {
    if (!schema.meta()?.title) {
      schema = schema.openapi({
        title: fallbackTitle,
        description: schema.meta()?.description || fallbackTitle,
      });
    }

    const schemaName = schema.meta()?.title || fallbackTitle;
    return { schema, schemaName };
  }

  private sanitizePath(path: string) {
    return path.replace(/\//g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  }

  private getStatusCodeDescription(statusCode: number): string {
    const descriptions: Record<number, string> = {
      200: 'Operação realizada com sucesso',
      201: 'Recurso criado com sucesso',
      400: 'Requisição inválida',
      401: 'Não autorizado',
      404: 'Recurso não encontrado',
      500: 'Erro interno do servidor',
    };
    return descriptions[statusCode] || 'Resposta da API';
  }

  generateSpec(): OpenAPIV3.Document {
    const generator = new OpenApiGeneratorV3(this.registry.definitions);
    return generator.generateDocument({
      openapi: '3.0.3',
      info: {
        title: 'API Documentos Eletrônicos',
        version: '1.0.0',
        description: 'Documentação automática da API usando schemas Zod',
      },
      servers: [{ url: 'http://localhost:3333' }],
    }) as OpenAPIV3.Document;
  }
}
