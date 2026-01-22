import * as v from "valibot";

export const PlatformRole = v.picklist(["user", "admin"]);
export type PlatformRole = v.InferOutput<typeof PlatformRole>;

//////////////
// Projects //
//////////////

export const ProjectId = v.pipe(v.string(), v.cuid2(), v.brand("ProjectId"));
export type ProjectId = v.InferOutput<typeof ProjectId>;

//////////////
// Sessions //
//////////////

export const SessionId = v.pipe(v.string(), v.cuid2(), v.brand("SessionId"));
export type SessionId = v.InferOutput<typeof SessionId>;

/////////////
// Tickets //
/////////////

export const TicketId = v.pipe(v.string(), v.cuid2(), v.brand("TicketId"));
export type TicketId = v.InferOutput<typeof TicketId>;

////////////////
// Timeclocks //
////////////////

export const TimeclockId = v.pipe(
  v.string(),
  v.cuid2(),
  v.brand("TimeclockId"),
);
export type TimeclockId = v.InferOutput<typeof TimeclockId>;

///////////
// Users //
///////////

export const UserId = v.pipe(v.string(), v.cuid2(), v.brand("UserId"));
export type UserId = v.InferOutput<typeof UserId>;
