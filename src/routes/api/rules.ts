import { error } from "@sveltejs/kit";
import { getRequestEvent } from "$app/server";
import { UserHandle } from "$types";

export const isLoggedIn = () => {
  const event = getRequestEvent();

  if (!event.locals.session) {
    throw error(401);
  }
};

export const isUserOrAdmin = (handle: UserHandle) => {
  const event = getRequestEvent();

  if (
    event.locals.session?.platformRole !== "admin" &&
    handle !== event.locals.session?.userHandle
  ) {
    throw error(401);
  }
};
