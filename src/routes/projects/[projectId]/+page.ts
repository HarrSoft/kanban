import { getProject } from "$lib/remote";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params }) => {
  const project = await getProject(params.projectId);
  return { project };
};
