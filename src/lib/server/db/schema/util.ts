import { text, timestamp } from "drizzle-orm/pg-core";
import { cuid2 } from "../../crypto";

export const id = (name?: string) =>
  (name ? text(name) : text()).$default(cuid2);

export const timestamps = {
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at"),
};
