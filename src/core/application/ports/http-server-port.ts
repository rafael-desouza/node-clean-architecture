export interface RequestContext {
  getParams(): Record<string, unknown>;
  getBody<T>(): Promise<T>;
  getQuery<T>(): Promise<T>;
  getHeaders(): Record<string, unknown>;
  getCookies(): Record<string, unknown>;
  setData(key: string, value: unknown): void;
  getData<T>(key: string): T;
}

export enum HttpMethod {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  DELETE = 'delete',
}

export interface Schema<SchemaType = unknown> {
  summary: string;
  description?: string;
  tags?: string[];
  bodySchema?: SchemaType;
  paramsSchema?: SchemaType;
  querySchema?: SchemaType;
  headersSchema?: SchemaType;
  cookiesSchema?: SchemaType;
  responses?: { [statusCode: number]: SchemaType };
}

export interface HttpRoute<SchemaType = unknown> {
  path: string;
  method: HttpMethod;
  successStatusCode?: number;
  middleware?: ((context: RequestContext) => Promise<void>)[];
  schema?: Schema<SchemaType>;
  handler: (
    body?: Record<string, unknown>,
    params?: Record<string, unknown>,
    query?: Record<string, unknown>,
    headers?: Record<string, unknown>,
    cookies?: Record<string, unknown>
  ) => Promise<unknown> | unknown;
}

export interface HttpServerPort<ServerType = unknown, SchemaType = unknown> {
  route(route: HttpRoute<SchemaType>): void;
  listen(port: number): void;
  getServer(): ServerType;
}
