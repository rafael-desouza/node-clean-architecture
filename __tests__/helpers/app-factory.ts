import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { CompositionRoot } from '@/composition-root';
import { HttpServerPort } from '@/core/application/ports/http-server-port';
import * as schema from '@/infra/persistence/drizzle/schema';

export function createTestApp(pool: Pool): {
  app: HttpServerPort;
  db: NodePgDatabase<typeof schema>;
} {
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL environment variable is not set');
  }

  const compositionRoot = new CompositionRoot(process.env.TEST_DATABASE_URL);
  const { httpServer } = compositionRoot.createAndBindControllers();

  const db = drizzle(pool, { schema });

  return {
    app: httpServer,
    db,
  };
}
