import { eq, and, gte, lte } from "drizzle-orm";
import * as v from "valibot";
import { error } from "@sveltejs/kit";
import { getRequestEvent, command, query } from "$app/server";
import db, { projectMembers, projects, timeclocks } from "$db";
import { ProjectId, Timeclock, TimeclockId } from "$types";

/////////////////////////
// getTimeclocks query //
/////////////////////////

export const getTimeclocks = query(
  v.object({
    projectId: ProjectId,
    from: v.date(),
    to: v.date(),
  }),
  async ({ projectId, from, to }) => {
    const session = getRequestEvent().locals.session;
    if (!session) {
      throw error(401, "Must be logged in");
    }

    // fetch times
    const times = await db.transaction(async tx => {
      if (session.platformRole === "user") {
        // do an authorization check only if the user is not an admin
        const dbRes = await tx
          .select({ id: projects.id, userId: projectMembers.userId })
          .from(projects)
          .leftJoin(projectMembers, eq(projectMembers.projectId, projects.id))
          .where(eq(projectMembers.userId, session.userId));

        if (dbRes.length < 1) {
          throw error(
            403,
            "Either the project doesn't exist or you are not a member",
          );
        }
      } else if (session.platformRole === "admin") {
        // if user is an admin, only do existence check
        const dbRes = await tx
          .select({ id: projects.id })
          .from(projects)
          .where(eq(projects.id, projectId));

        if (dbRes.length < 1) {
          throw error(404, "No such project");
        }
      } else {
        throw new Error("Unreachable");
      }

      const times = await tx
        .select()
        .from(timeclocks)
        .where(
          and(
            eq(timeclocks.userId, session.userId),
            eq(timeclocks.projectId, projectId),
            gte(timeclocks.start, from),
            lte(timeclocks.start, to),
          ),
        );

      return times;
    });

    return v.parse(v.array(Timeclock), times satisfies Timeclock[]);
  },
);

/////////////////////////////
// createTimeclock command //
/////////////////////////////

export const createTimeclock = command(
  v.object({
    projectId: ProjectId,
    start: v.date(),
    duration: v.optional(v.number()),
  }),
  async ({ projectId, start, duration }) => {
    const event = getRequestEvent();
    const session = event.locals.session;
    if (!session) {
      throw error(401);
    }

    const startDate = new Date(start);

    if (duration && duration < 0) {
      throw error(400, "End date occurs before start date");
    }

    const timeclock = await db.transaction(async tx => {
      const [tc] = await tx
        .insert(timeclocks)
        .values({
          projectId,
          userId: session.userId,
          start: startDate,
          duration: duration ?? undefined,
        })
        .returning();

      return tc;
    });

    return v.parse(Timeclock, timeclock satisfies Timeclock);
  },
);

/////////////////////////////
// updateTimeclock command //
/////////////////////////////

export const updateTimeclock = command(
  v.object({
    timeclockId: TimeclockId,
    start: v.optional(v.date()),
    duration: v.optional(v.number()),
    admin: v.optional(
      v.object({
        locked: v.optional(v.boolean()),
      }),
    ),
  }),
  async ({ timeclockId, start, duration, admin }) => {
    // authenticate
    const event = getRequestEvent();
    const session = event.locals.session;
    if (!session) {
      throw error(401, "Must be logged in");
    } else if (admin && session.platformRole !== "admin") {
      throw error(403, "Non-admins cannot set admin fields");
    }

    const startDate = start ? new Date(start) : null;

    const updatedTimeclock = await db.transaction(async tx => {
      const [rec] = await tx
        .select({
          projectId: projects.id,
          locked: timeclocks.locked,
        })
        .from(projects)
        .innerJoin(timeclocks, eq(projects.id, timeclocks.projectId))
        .where(eq(timeclocks.id, timeclockId));

      if (!rec) {
        throw error(404, "No such timeclock");
      } else if (rec.locked && session.platformRole !== "admin") {
        throw error(403, "Timeclock has been locked");
      }

      const [updatedTc] = await tx
        .update(timeclocks)
        .set({
          start: startDate ?? undefined,
          duration: duration ?? undefined,
          locked: admin?.locked ?? undefined,
        })
        .where(eq(timeclocks.id, timeclockId))
        .returning();

      return updatedTc;
    });

    return v.parse(Timeclock, updatedTimeclock satisfies Timeclock);
  },
);
