import * as v from "valibot";

export const Theme = v.picklist([
	"auto",
	"burning-love",
	"oceanside",
	"ribbit-dark",
	"ribbit-light",
]);
export type Theme = v.InferOutput<typeof Theme>;
