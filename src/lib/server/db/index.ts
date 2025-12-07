import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { env } from "$env/dynamic/private";

if (!env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

const client = postgres(env.DATABASE_URL);

const db = drizzle({ client, schema });
export default db;

export * from "./schema";

export type Tx =
  | typeof db
  | Parameters<Parameters<(typeof db)["transaction"]>[0]>[0];
