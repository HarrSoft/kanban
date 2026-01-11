import { z } from "zod";

export const PlatformRole = z.enum(["user", "admin", "viewer"]);
export type PlatformRole = z.infer<typeof PlatformRole>;

//////////////
// Projects //
//////////////

export const ProjectId = z.cuid2().brand<"ProjectId">();
export type ProjectId = z.infer<typeof ProjectId>;

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
