import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL environment variable is not set!");
}

export const db = drizzle(url, { schema });
export type DB = typeof db;
