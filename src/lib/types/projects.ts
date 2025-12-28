import { z } from "zod";
import { ProjectId } from "./ids";
import { UserInfo } from "./users";

export const ProjectMemberRole = z.enum(["admin", "contributor", "viewer"]);
export type ProjectMemberRole = z.infer<typeof ProjectMemberRole>;

export const ProjectInfo = z.object({
  id: ProjectId,
  name: z.string(),
  imageUrl: z.url().nullable(),
});
export type ProjectInfo = z.infer<typeof ProjectInfo>;

export const ProjectFull = ProjectInfo.extend({
  admins: UserInfo.array(),
  contributors: UserInfo.array(),
  viewers: UserInfo.array(),
});
export type ProjectFull = z.infer<typeof ProjectFull>;
