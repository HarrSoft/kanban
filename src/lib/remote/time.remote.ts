import * as df from "date-fns";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import * as v from "valibot";
import { error, redirect } from "@sveltejs/kit";
import { getRequestEvent, command, form, query } from "$app/server";
import db, { projectMembers, projects, timeclocks } from "$db";
import { ProjectId, TimeclockId, Timeclock, Seconds, Unix } from "$types";

////////////////////////////
// listMyTimeclocks query //
////////////////////////////

export const listMyTimeclocks = query(
  v.object({
    projectId: ProjectId,
    from: v.optional(Unix),
    to: v.optional(Unix),
  }),
  async ({ projectId, from, to }) => {
    const session = getRequestEvent().locals.session;
    if (!session) {
      throw error(401, "Must be logged in");
    }

    // fetch clocks
    const clocks = await db.transaction(async tx => {
      const timeConditions = [
        eq(timeclocks.userId, session.userId),
        eq(timeclocks.projectId, projectId),
      ];

      if (from) {
        timeConditions.push(gte(timeclocks.start, from));
      }
      if (to) {
        timeConditions.push(lte(timeclocks.start, to));
      }
      const clocks = await tx
        .select({ id: timeclocks.id })
        .from(timeclocks)
        .where(and(...timeConditions));

      return clocks;
    });

    return clocks.map(c => c.id);
  },
);

////////////////////////
// getTimeclock query //
////////////////////////

export const getTimeclock = query.batch(TimeclockId, async timeclockIds => {
  const session = getRequestEvent().locals.session;
  if (!session) {
    throw error(401, "Must be logged in");
  }

  const rawClocks = await db.transaction(async tx => {
    const conditions = [
      inArray(timeclocks.id, timeclockIds),
      session.platformRole !== "admin" ?
        eq(projectMembers.userId, session.userId)
      : [],
    ].flat();

    const rcs = await tx
      .select({
        clock: timeclocks,
        role: projectMembers.role,
      })
      .from(timeclocks)
      .innerJoin(
        projectMembers,
        eq(timeclocks.projectId, projectMembers.projectId),
      )
      .where(and(...conditions));

    return rcs;
  });

  const clockMap = new Map(rawClocks.map(rc => [rc.clock.id, rc]));

  return timeclockId => {
    const raw = clockMap.get(timeclockId);

    if (!raw) {
      throw error(404);
    } else if (
      session.platformRole !== "admin" &&
      raw.role !== "admin" &&
      raw.clock.userId !== session.userId
    ) {
      throw error(403);
    }

    return v.parse(Timeclock, raw.clock satisfies Timeclock);
  };
});

//////////////////////////
// createTimeclock form //
//////////////////////////

export const createTimeclock = form(
  v.object({
    projectId: ProjectId,
  }),
  async ({ projectId }) => {
    const event = getRequestEvent();
    const session = event.locals.session;
    if (!session) {
      throw error(401);
    }

    const timeclock = await db.transaction(async tx => {
      const [tc] = await tx
        .insert(timeclocks)
        .values({
          projectId,
          userId: session.userId,
          start: df.getUnixTime(new Date()),
        })
        .returning();

      return tc;
    });

    listMyTimeclocks({ projectId }).refresh();

    return v.parse(Timeclock, timeclock satisfies Timeclock);
  },
);

//////////////////////////
// updateTimeclock form //
//////////////////////////

export const updateTimeclock = form(
  v.object({
    timeclockId: TimeclockId,
    start: v.optional(Unix),
    duration: v.optional(Seconds),
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

    const updatedClock = await db.transaction(async tx => {
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

      const [updatedClock] = await tx
        .update(timeclocks)
        .set({
          start: start ?? undefined,
          duration: duration ?? undefined,
          locked: admin?.locked ?? undefined,
        })
        .where(eq(timeclocks.id, timeclockId))
        .returning();

      return updatedClock;
    });

    const cleanClock = v.parse(Timeclock, updatedClock satisfies Timeclock);

    getTimeclock(timeclockId).set(cleanClock);

    throw redirect(303, "/time");
  },
);

//////////////////////////
// deleteTimeclock form //
//////////////////////////

export const deleteTimeclock = form(
  v.object({
    timeclockId: TimeclockId,
  }),
  async ({ timeclockId }) => {
    // authenticate
    const event = getRequestEvent();
    const session = event.locals.session;
    if (!session) {
      throw error(401, "Must be logged in");
    }

    const projectId = await db.transaction(async tx => {
      const [clock] = await tx
        .select({
          projectId: timeclocks.projectId,
          locked: timeclocks.locked,
          userId: timeclocks.userId,
        })
        .from(timeclocks)
        .where(eq(timeclocks.id, timeclockId));

      if (!clock) {
        throw error(404);
      }

      const [member] = await tx
        .select({ role: projectMembers.role })
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.userId, session.userId),
            eq(projectMembers.projectId, clock.projectId),
          ),
        );

      if (!member || member.role === "viewer") {
        throw error(
          403,
          "Only project contributors may edit project timeclocks",
        );
      } else if (clock.locked && session.platformRole !== "admin") {
        throw error(403, "Only admins may edit locked timeclocks");
      } else if (
        member.role === "contributor" &&
        clock.userId !== session.userId
      ) {
        throw error(403, "You may not edit others' timeclocks");
      }

      await tx.delete(timeclocks).where(eq(timeclocks.id, timeclockId));

      return clock.projectId;
    });

    listMyTimeclocks({ projectId }).refresh();
  },
);

///////////////////////
// pingClock command //
///////////////////////

export const pingClock = command(
  v.object({
    timeclockId: TimeclockId,
    newDuration: Seconds,
  }),
  async ({ timeclockId, newDuration }) => {
    // authenticate
    const event = getRequestEvent();
    const session = event.locals.session;
    if (!session) {
      throw error(401, "Must be logged in");
    }

    const [updatedTc] = await db.transaction(async tx => {
      const [clock] = await tx
        .select({
          projectId: timeclocks.projectId,
          locked: timeclocks.locked,
          userId: timeclocks.userId,
        })
        .from(timeclocks)
        .where(eq(timeclocks.id, timeclockId));

      if (!clock) {
        throw error(404);
      }

      const [member] = await tx
        .select({ role: projectMembers.role })
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.userId, session.userId),
            eq(projectMembers.projectId, clock.projectId),
          ),
        );

      if (!member || member.role === "viewer") {
        throw error(
          403,
          "Only project contributors may edit project timeclocks",
        );
      } else if (clock.locked && session.platformRole !== "admin") {
        throw error(403, "Only admins may edit locked timeclocks");
      } else if (
        member.role === "contributor" &&
        clock.userId !== session.userId
      ) {
        throw error(403, "You may not edit others' timeclocks");
      }

      return await tx
        .update(timeclocks)
        .set({ duration: newDuration })
        .where(eq(timeclocks.id, timeclockId))
        .returning();
    });

    const cleanTc = v.parse(Timeclock, updatedTc satisfies Timeclock);

    getTimeclock(timeclockId).set(cleanTc);
  },
);
