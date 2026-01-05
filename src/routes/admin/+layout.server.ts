import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.session) {
    throw redirect(303, "/");
  } else if (locals.session.platformRole !== "admin") {
    throw redirect(303, "/project");
  }
};
