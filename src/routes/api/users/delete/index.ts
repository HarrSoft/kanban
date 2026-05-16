import { apiFetch } from "$api/util";
import { UserId } from "$types";
import * as v from "valibot";

export const Input = UserId;
export type Input = v.InferInput<typeof Input>;

export const Result = v.variant("ok", [
	v.object({
		ok: v.literal(true),
	}),
	v.object({
		ok: v.literal(false),
		reason: v.picklist(["unauthorized", "unknown"]),
	}),
]);
export type Result = v.InferOutput<typeof Result>;

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
