import { error } from "@sveltejs/kit";
import { getRequestEvent } from "$app/server";

export const isLoggedIn = () => {
	const event = getRequestEvent();

	if (!event.locals.session) {
		throw error(401);
	}
};

export const isUserOrAdmin = (userId: string) => {
	const event = getRequestEvent();
	const session = event.locals.session;

	if (!session) {
		throw error(401);
	}

	if (session.userId !== userId && session.platformRole !== "admin") {
		throw error(401);
	}
};
