import { SQL } from "bun";
import { drizzle } from "drizzle-orm/bun-sql";
import * as schema from "./schema";
import { env } from "$env/dynamic/private";

const client = new SQL(env.DATABASE_URL);

const db = drizzle({ client, schema });
export default db;

export * from "./schema";

export type Tx =
  | typeof db
  | Parameters<Parameters<(typeof db)["transaction"]>[0]>[0];
