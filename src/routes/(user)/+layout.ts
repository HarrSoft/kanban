import type { LayoutLoad } from "./$types";
import { getProjects } from "./projects.remote";

export const load: LayoutLoad = async ({ data }) => {
  return {
    ...data,
    projects: data.session ? await getProjects() : [],
  };
};
