import * as df from "date-fns";
import { eq, and, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { error } from "@sveltejs/kit";
import { getRequestEvent, query } from "$app/server";
import db, { timeclocks } from "$db";
import { ProjectId, Timeclock } from "$types";

export const getTimeclocks = query(
  z.object({
    project: ProjectId,
    from: z.date(),
    to: z.date(),
  }),
  async ({ project, from, to }) => {
    const event = getRequestEvent();
    if (!event.locals.session) {
      return error(401);
    }

    const times = await db
      .select()
      .from(timeclocks)
      .where(
        and(
          eq(timeclocks.userId, event.locals.session.userId),
          eq(timeclocks.projectId, project),
          gte(timeclocks.start, from),
          lte(timeclocks.start, to),
        ),
      );

    return Timeclock.array().parse(times satisfies Timeclock[]);
  },
);
