import * as v from "valibot";
import { ProjectId } from "./ids";
import { UserInfo } from "./users";

export const ProjectMemberRole = v.picklist(["admin", "contributor", "viewer"]);
export type ProjectMemberRole = v.InferOutput<typeof ProjectMemberRole>;

const projectInfoBase = {
  id: ProjectId,
  name: v.string(),
  imageUrl: v.nullable(v.pipe(v.string(), v.url())),
};

export const ProjectInfo = v.object({
  ...projectInfoBase,
});
export type ProjectInfo = v.InferOutput<typeof ProjectInfo>;

export const ProjectFull = v.object({
  ...projectInfoBase,
  admins: v.array(UserInfo),
  contributors: v.array(UserInfo),
  viewers: v.array(UserInfo),
});
export type ProjectFull = v.InferOutput<typeof ProjectFull>;
