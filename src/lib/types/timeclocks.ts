import { z } from "zod";
import { ProjectId, TimeclockId, UserId } from "./ids";

export const Timeclock = z.object({
  id: TimeclockId,
  projectId: ProjectId,
  userId: UserId,
  start: z.date(),
  end: z.date(),
  duration: z.number(), // seconds
});
export type Timeclock = z.infer<typeof Timeclock>;
