import type { Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import { handle as authHandle } from "$server/auth/handle";
import { ProjectId } from "$types";

const activeProjectHandle: Handle = ({ event, resolve }) => {
  const activeProjectId = event.cookies.get("activeProject") || null;

  event.locals.activeProjectId = activeProjectId as ProjectId | null;

  return resolve(event);
};

export const handle: Handle = sequence(authHandle, activeProjectHandle);
