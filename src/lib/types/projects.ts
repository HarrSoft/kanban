import { z } from "zod";

export const ProjectMemberRole = z.enum(["admin", "contributor", "viewer"]);
export type ProjectMemberRole = z.infer<typeof ProjectMemberRole>;
