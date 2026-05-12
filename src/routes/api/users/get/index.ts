import { apiFetch } from "$api/util";
import { UserId, UserProfile } from "$types";
import * as v from "valibot";

export const Input = UserId;
export type Input = v.InferInput<typeof Input>;

export const Result = v.variant("ok", [
	v.object({
		ok: v.literal(true),
		user: UserProfile,
	}),
	v.object({
		ok: v.literal(false),
		reason: v.picklist(["unauthorized", "not found", "unknown"]),
	}),
]);
export type Result = v.InferOutput<typeof Result>;

export default async (input: Input): Promise<Result> => {
	const res = await apiFetch("/api/users/get", {
		method: "POST",
		body: JSON.stringify(input),
	});

	if (res.ok) {
		const user = await res.json();
		return { ok: true, user };
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
