import type { Handle } from "@sveltejs/kit";
import { handle as authHandle } from "$server/auth/handle";

export const handle: Handle = authHandle;
