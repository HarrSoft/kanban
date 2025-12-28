import { eq, and, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { error } from "@sveltejs/kit";
import { getRequestEvent, command, query } from "$app/server";
import db, { projectMembers, projects, timeclocks } from "$db";
import { ProjectId, Timeclock, TimeclockId } from "$types";

export const getTimeclocks = query(
  z.object({
    projectId: ProjectId,
    from: z.date(),
    to: z.date(),
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
          )
        );

      return times;
    });

    return Timeclock.array().parse(times satisfies Timeclock[]);
  },
);

export const createTimeclock = command(
  z.object({
    projectId: ProjectId,
    start: z.iso.date(),
    duration: z.number().optional(),
  }),
  async ({ projectId, start, duration }) => {
    const event = getRequestEvent();

    const startDate = new Date(start)

    if (duration && duration < 0) {
      throw error(400, "End date occurs before start date");
    }

    const timeclock = await db.transaction(async tx => {
      const [tc] = await tx
        .insert(timeclocks)
        .values({
          projectId,
          userId: event.locals.session!.userId,
          start: startDate,
          duration: duration ?? undefined,
        })
        .returning();

      return tc;
    });

    return Timeclock.parse(timeclock satisfies Timeclock);
  },
);

export const updateTimeclock = command(
  z.object({
    timeclockId: TimeclockId,
    start: z.iso.date().optional(),
    duration: z.number().optional(),
    admin: z.object({
      locked: z.boolean().optional(),
    }).optional(),
  }),
  async ({ timeclockId, start, duration, admin }) => {
    // authenticate
    const event = getRequestEvent();
    if (!event.locals.session) {
      throw error(401, "Must be logged in");
    } else if (admin && event.locals.session.platformRole !== "admin") {
      throw error(403, "Non-admins cannot set admin fields");
    }

    const startDate = start ? new Date(start) : null;

    const updatedTimeclock = await db.transaction(async tx => {
      const [project] = await tx
        .select({ id: projects.id })
        .from(projects)
        .innerJoin(timeclocks, eq(projects.id, timeclocks.projectId))
        .where(eq(timeclocks.id, timeclockId));

      if (!project) {
        throw error(404, "No such timeclock");
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

    return Timeclock.parse(updatedTimeclock satisfies Timeclock);
  },
);
