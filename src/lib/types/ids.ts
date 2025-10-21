import { z } from "zod";
import type { Branded } from "$types/util";

export const PlatformRole = z.enum(["user", "admin"]);
export type PlatformRole = z.infer<typeof PlatformRole>;

//////////////
// Projects //
//////////////

export const ProjectId = z.cuid2();
export type ProjectId = Branded<z.infer<typeof ProjectId>, "ProjectId">;

export const ProjectHandle = z.string().min(3);
export type ProjectHandle = Branded<
  z.infer<typeof ProjectHandle>,
  "ProjectHandle"
>;

export const ProjectIdentity = z
  .object({
    id: ProjectId,
    handle: ProjectHandle,
  })
  .partial();
export type ProjectIdentity = z.infer<typeof ProjectIdentity>;

//////////////
// Sessions //
//////////////

export const SessionId = z.cuid2();
export type SessionId = Branded<z.infer<typeof SessionId>, "SessionId">;

/////////////
// Tickets //
/////////////

export const TicketId = z.cuid2();
export type TicketId = Branded<z.infer<typeof TicketId>, "TicketId">;

////////////////
// Timeclocks //
////////////////

export const TimeclockId = z.cuid2();
export type TimeclockId = Branded<z.infer<typeof TimeclockId>, "TimeclockId">;

///////////
// Users //
///////////

export const UserId = z.cuid2();
export type UserId = Branded<z.infer<typeof UserId>, "UserId">;

export const UserHandle = z.string().min(3);
export type UserHandle = Branded<z.infer<typeof UserHandle>, "UserHandle">;

export const UserIdentity = z
  .object({
    id: UserId,
    handle: UserHandle,
    email: z.email(),
  })
  .partial();
export type UserIdentity = z.infer<typeof UserIdentity>;
