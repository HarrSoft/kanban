import { getProjects } from "./projects.remote";
import { ProjectId } from "$types";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ cookies, locals }) => {
  const projects = locals.session ? await getProjects() : [];

  let activeProject = (cookies.get("activeProject") ||
    null) as ProjectId | null;

  // verify that user actually has this project
  if (activeProject && !projects.find(p => p.id === activeProject)) {
    cookies.delete("activeProject", { path: "/" });
    activeProject = null;
  }

  return {
    session: locals?.session || null,
    projects,
    activeProject,
  };
};
