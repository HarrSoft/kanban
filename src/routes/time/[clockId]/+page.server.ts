import { getTimeclock } from "$lib/remote";
import { TimeclockId } from "$types";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
	const { clockId } = params;
	const result = TimeclockId.safeParse(clockId);
	if (!result.success) {
		error(404, "Invalid timeclock ID");
	}

	const clock = await getTimeclock(result.data as string);
	if (!clock) {
		error(404, "Timeclock not found");
	}

	return { clock };
};
