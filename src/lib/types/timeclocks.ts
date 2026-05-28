import * as v from "valibot";
import { ProjectId, TimeclockId, UserId } from "./ids";
import { Seconds, Unix } from "./util";

export const Timeclock = v.object({
	id: TimeclockId,
	projectId: ProjectId,
	userId: UserId,
	start: Unix,
	duration: Seconds,
	locked: v.boolean(),
	notes: v.optional(v.string()),
	createdAt: Unix,
});
export type Timeclock = v.InferOutput<typeof Timeclock>;
