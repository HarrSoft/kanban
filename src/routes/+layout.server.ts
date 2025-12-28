import { ProjectId } from "$types";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ cookies, locals }) => {
  const activeProject = cookies.get("activeProject") as ProjectId | undefined;
  return {
    session: locals?.session || null,
    user: locals?.user || null,
    activeProject: activeProject || null,
  };
};
