import { getTimeclock } from "$lib/remote";
import { TimeclockId } from "$types";

export async function load({ params }) {
	const { clockId } = params;
	const parsed = TimeclockId.safeParse(clockId);
	if (!parsed.success) {
		throw error(404, "Invalid timeclock ID");
	}

	const clock = await getTimeclock(parsed.value);
	if (!clock) {
		throw error(404, "Timeclock not found");
	}

	return { clock };
}
