import { error } from "@sveltejs/kit";
import { z } from "zod";
import { command, getRequestEvent } from "$app/server";
import { ProjectId } from "$types";

export const pickProject = command(
  z.object({
    projectId: ProjectId.nullable(),
  }),
  async ({ projectId }) => {
    const event = getRequestEvent();
    if (!event.locals.session) {
      throw error(401);
    }

    if (projectId) {
      event.cookies.set("activeProject", projectId, { path: "/" });
    } else {
      event.cookies.delete("activeProject", { path: "/" });
    }
  },
);
