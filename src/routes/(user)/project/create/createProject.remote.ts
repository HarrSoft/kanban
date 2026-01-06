import { error } from "@sveltejs/kit";
import { z } from "zod";
import db, { projects, projectMembers } from "$db";
import { command, getRequestEvent } from "$app/server";

export const createProject = command(
  z.object({
    name: z.string(),
  }),
  async ({ name }) => {
    const event = getRequestEvent();
    if (!event.locals.session) {
      throw error(401);
    }
    const session = event.locals.session;

    const newProjectId = await db.transaction(async tx => {
      const [newProject] = await tx
        .insert(projects)
        .values({ name })
        .returning({
          id: projects.id,
        });

      await tx.insert(projectMembers).values({
        projectId: newProject.id,
        userId: session.userId,
        role: "admin",
      });

      return newProject.id;
    });

    return newProjectId;
  },
);
