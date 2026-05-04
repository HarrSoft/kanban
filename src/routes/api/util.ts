import { browser } from "$app/environment";
import { getRequestEvent } from "$app/server";

export const apiFetch = (...args: Parameters<typeof fetch>) => {
  if (browser) {
    return fetch(...args);
  } else {
    const { fetch } = getRequestEvent();
    return fetch(...args);
  }
};
