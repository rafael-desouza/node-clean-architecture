import { HttpRoute } from './http-server-port';

export interface DocumentationPort<SchemaType = unknown> {
  addRoute(route: HttpRoute<SchemaType>): void;
  generateSpec(): unknown;
}
