import { z } from "zod";
import { apiFetch } from "$api/util";
import { UserIdentity } from "$types";

export const Input = UserIdentity;
export type Input = z.input<typeof Input>;

export const Result = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
  }),
  z.object({
    ok: z.literal(false),
    reason: z.enum(["unauthorized", "unknown"]),
  }),
]);
export type Result = z.output<typeof Result>;

export default async (input: Input): Promise<Result> => {
  const res = await apiFetch("/api/users/delete", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (res.ok) {
    return { ok: true };
  } else {
    return {
      ok: false,
      reason: res.status === 401 ? "unauthorized" : "unknown",
    };
  }
};
