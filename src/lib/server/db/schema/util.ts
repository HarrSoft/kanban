import * as df from "date-fns";
import * as t from "drizzle-orm/pg-core";
import { cuid2 } from "$server/crypto";
import { Seconds, Unix } from "$types";

export const id = (name?: string) =>
  (name ? t.text(name) : t.text()).$default(cuid2);

export const seconds = (name?: string) =>
  (name ? t.integer(name) : t.integer()).$type<Seconds>();

export const unix = (name?: string) =>
  (name ?
    t.bigint(name, { mode: "number" })
  : t.bigint({ mode: "number" })
  ).$type<Unix>();

export const unixNow = () => df.getUnixTime(new Date()) as Unix;

export const timestamps = {
  createdAt: unix("created_at").notNull().$default(unixNow),
  updatedAt: unix("updated_at").notNull().$onUpdate(unixNow),
  deletedAt: unix("deleted_at"),
};
