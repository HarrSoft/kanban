import { error, redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = locals.session;

	if (!session) {
		redirect(302, "/login");
	}

	if (session.platformRole !== "admin") {
		error(403, "Admin access required");
	}

	return { session };
};
