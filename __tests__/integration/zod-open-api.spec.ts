/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { HttpMethod } from '@/core/application/ports/http-server-port';
import { ZodOpenApiDocumentation } from '@/infra/adapters/documentation/zod-open-api';

describe('ZodOpenApiDocumentation Adapter', () => {
  it('should correctly generate an OpenAPI specification from a registered route', () => {
    const docGenerator = new ZodOpenApiDocumentation();

    const exampleRoute = {
      method: HttpMethod.POST,
      path: '/test/users/{id}',
      successStatusCode: 201,
      schema: {
        summary: 'Create a test user',
        tags: ['Test'],
        paramsSchema: z
          .object({
            id: z.string().meta({
              param: { name: 'id', in: 'path' },
            }),
          })
          .meta({ description: 'Parameters for creating a user' }),
        bodySchema: z.object({ name: z.string() }).meta({
          title: 'CreateUserRequest',
          description: 'Request to create a user',
        }),
        responses: {
          201: z
            .object({ success: z.boolean() })
            .meta({ title: 'CreateUserResponse' }),
        },
      },
      handler: async () => ({ success: true }),
    };

    docGenerator.addRoute(exampleRoute);
    const openApiSpec = docGenerator.generateSpec();

    const path = openApiSpec.paths['/test/users/{id}'];
    expect(path).toBeDefined();
    expect(path!.post).toBeDefined();

    expect(path!.post?.summary).toBe('Create a test user');
    expect(path!.post?.tags).toContain('Test');

    const requestBodyRef = (path!.post?.requestBody as any)?.content[
      'application/json'
    ].schema.$ref;
    expect(requestBodyRef).toBe('#/components/schemas/CreateUserRequest');
    expect(openApiSpec.components?.schemas?.CreateUserRequest).toBeDefined();

    const responseRef = (path!.post?.responses as any)['201'].content[
      'application/json'
    ].schema.$ref;
    expect(responseRef).toBe('#/components/schemas/CreateUserResponse');
    expect(openApiSpec.components?.schemas?.CreateUserResponse).toBeDefined();
  });

  it('should handle routes with no request schema and unknown status codes', () => {
    const docGenerator = new ZodOpenApiDocumentation();

    const simpleRoute = {
      method: HttpMethod.GET,
      path: '/any-route',
      schema: {
        summary: 'Any route',
      },
      handler: async () => ({ status: 'ok' }),
    };

    docGenerator.addRoute(simpleRoute);
    const openApiSpec = docGenerator.generateSpec();

    const path = openApiSpec.paths['/any-route'];
    expect(path).toBeDefined();

    expect(path!.get?.requestBody).toBeUndefined();

    const response = (path!.get?.responses as any)['200'];
    expect(response).toBeDefined();

    expect(response.description).toBe('Operação realizada com sucesso');

    const responseRef = response.content['application/json'].schema.$ref;
    expect(responseRef).toBe('#/components/schemas/SuccessResponse');
    const componentSchema = openApiSpec.components?.schemas
      ?.SuccessResponse as any;
    expect(componentSchema).toBeDefined();
    expect(componentSchema.description).toBe('Resposta de sucesso padrão');
  });
});
