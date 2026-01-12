import { getProject, getProjects } from "$lib/remote";
import { Session, ProjectInfo, ProjectFull } from "$types";
import type { LayoutLoad } from "./$types";

interface Data {
  session: Session | null;
  activeProject: ProjectFull | null;
  projects: ProjectInfo[];
}

export const load: LayoutLoad = async ({ data }) => {
  if (!data.session) {
    return {
      session: null,
      activeProject: null,
      projects: [],
    } satisfies Data as Data;
  }

  const projects = data.session ? await getProjects() : [];

  const activeProject =
    data.activeProjectId ? await getProject(data.activeProjectId) : null;

  return {
    session: data.session,
    activeProject,
    projects,
  } satisfies Data as Data;
};
