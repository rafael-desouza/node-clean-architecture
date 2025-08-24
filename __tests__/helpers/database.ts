/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { PgTable } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';

import * as schema from '@/infra/persistence/drizzle/schema';

export async function setupTestDatabase() {
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL environment variable is not set');
  }

  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const db = drizzle(pool);

  await migrate(db, { migrationsFolder: './drizzle' });

  await pool.end();
}

export async function cleanupDatabase(pool: Pool) {
  const db = drizzle(pool, { schema });

  const tableNames = Object.values(schema)
    .filter((table): table is any => table instanceof PgTable)
    // @ts-expect-error - We now that Symbol exists in PgTable in execution time,
    .map((table) => `"${(table as any)[PgTable.Symbol.Name]}"`)
    .join(', ');

  if (tableNames) {
    await db.execute(
      sql.raw(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`)
    );
  }
}
