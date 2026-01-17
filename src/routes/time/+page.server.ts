import * as df from "date-fns";
import { error } from "@sveltejs/kit";
import { getTimeclocks } from "$lib/remote";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, url }) => {
  if (!locals.session) {
    throw error(401);
  } else if (!locals.activeProjectId) {
    throw error(400, "Please set an active project");
  }

  const now = new Date();
  const fromUrl = url.searchParams.get("from");
  const toUrl = url.searchParams.get("to");

  const from = fromUrl ? df.fromUnixTime(Number(fromUrl)) : df.startOfWeek(now);
  const to = toUrl ? df.fromUnixTime(Number(toUrl)) : df.endOfWeek(now);

  const timeclocks = await getTimeclocks({
    projectId: locals.activeProjectId,
    from,
    to,
  });

  return { timeclocks };
};
