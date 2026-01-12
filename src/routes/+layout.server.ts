import { ProjectId } from "$types";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ cookies, locals }) => {
  let activeProjectId = (cookies.get("activeProject") ||
    null) as ProjectId | null;

  return {
    session: locals?.session || null,
    activeProjectId,
  };
};
