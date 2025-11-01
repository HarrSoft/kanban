import { z } from "zod";

export const PlatformRole = z.enum(["user", "admin"]);
export type PlatformRole = z.infer<typeof PlatformRole>;

//////////////
// Projects //
//////////////

export const ProjectId = z.cuid2().brand<"ProjectId">();
export type ProjectId = z.infer<typeof ProjectId>;

export const ProjectHandle = z.string().min(3).brand<"ProjectHandle">();
export type ProjectHandle = z.infer<typeof ProjectHandle>;

export const ProjectIdentity = z
  .object({
    id: ProjectId,
    handle: ProjectHandle,
  })
  .partial()
  .refine(val => val.id || val.handle);
export type ProjectIdentity = z.infer<typeof ProjectIdentity>;

//////////////
// Sessions //
//////////////

export const SessionId = z.cuid2().brand<"SessionId">();
export type SessionId = z.infer<typeof SessionId>;

/////////////
// Tickets //
/////////////

export const TicketId = z.cuid2().brand<"TicketId">();
export type TicketId = z.infer<typeof TicketId>;

////////////////
// Timeclocks //
////////////////

export const TimeclockId = z.cuid2().brand<"TimeclockId">();
export type TimeclockId = z.infer<typeof TimeclockId>;

///////////
// Users //
///////////

export const UserId = z.cuid2().brand<"UserId">();
export type UserId = z.infer<typeof UserId>;

export const UserHandle = z.string().min(3).brand<"UserHandle">();
export type UserHandle = z.infer<typeof UserHandle>;

export const UserIdentity = z
  .object({
    id: UserId,
    handle: UserHandle,
    email: z.email(),
  })
  .partial()
  .refine(val => val.id || val.handle || val.email);
export type UserIdentity = z.infer<typeof UserIdentity>;
