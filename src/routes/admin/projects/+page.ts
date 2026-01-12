import { getAllProjects } from "$lib/remote";
import type { PageLoad } from "./$types";

export const load: PageLoad = async () => {
  const allProjects = await getAllProjects();
  return { allProjects };
};
