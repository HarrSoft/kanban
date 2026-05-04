import { z } from "zod";
import { apiFetch } from "$api/util";
import { UserProfile, UserIdentity } from "$types";

export const Input = UserIdentity;
export type Input = z.input<typeof Input>;

export const Result = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    user: UserProfile,
  }),
  z.object({
    ok: z.literal(false),
    reason: z.enum(["unauthorized", "not found", "unknown"]),
  }),
]);
export type Result = z.output<typeof Result>;

export default async (input: Input): Promise<Result> => {
  const res = await apiFetch("/api/users/get", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (res.ok) {
    return Result.parse({
      ok: true,
      user: await res.json(),
    });
  } else {
    return {
      ok: false,
      reason:
        res.status === 401 ? "unauthorized"
        : res.status === 404 ? "not found"
        : "unknown",
    };
  }
};
