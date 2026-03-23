import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import type { NeonQueryResultHKT } from "drizzle-orm/neon-serverless";
import postgres from "postgres";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "./schema";
import { requireEnv } from "../../env";

type SchemaRelations = ExtractTablesWithRelations<typeof schema>;

function createDb() {
  const url = requireEnv("DATABASE_URL");

  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    neonConfig.webSocketConstructor = ws;
    const pool = new Pool({ connectionString: url });
    return drizzleNeon(pool, { schema });
  }

  const client = postgres(url);
  return drizzlePostgres(client, { schema });
}

export const db = createDb();

export type Database = ReturnType<typeof createDb>;
export type Transaction = PgTransaction<
  PostgresJsQueryResultHKT | NeonQueryResultHKT,
  typeof schema,
  SchemaRelations
>;
