import { getRequestEvent } from "$app/server";
import { JWT } from "$types";

export const getSessionTokenCookie = () => {
  const event = getRequestEvent();
  return event.cookies.get("session");
};

export const setSessionTokenCookie = (token: JWT) => {
  const event = getRequestEvent();
  event.cookies.set("session", token, {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
    sameSite: "lax",
    //secure: set by sveltekit
  });
};

export const deleteSessionTokenCookie = () => {
  const event = getRequestEvent();
  event.cookies.delete("session", { path: "/" });
};
