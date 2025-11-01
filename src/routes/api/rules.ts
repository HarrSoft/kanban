import { error } from "@sveltejs/kit";
import { getRequestEvent } from "$app/server";
import { UserIdentity } from "$types";

export const isLoggedIn = () => {
  const event = getRequestEvent();

  if (!event.locals.session) {
    throw error(401);
  }
};

export const isUserOrAdmin = (ident: UserIdentity) => {
  const event = getRequestEvent();
  const session = event.locals.session;

  if (!session) {
    throw error(401);
  }

  const isUser =
    ident.id === session.userId ||
    ident.handle === session.userHandle ||
    ident.email === session.userEmail;

  if (!isUser && session.platformRole !== "admin") {
    throw error(401);
  }
};
