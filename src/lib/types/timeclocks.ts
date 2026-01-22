import * as v from "valibot";
import { ProjectId, TimeclockId, UserId } from "./ids";

export const Timeclock = v.object({
  id: TimeclockId,
  projectId: ProjectId,
  userId: UserId,
  start: v.date(),
  duration: v.number(), // seconds
});
export type Timeclock = v.InferOutput<typeof Timeclock>;
