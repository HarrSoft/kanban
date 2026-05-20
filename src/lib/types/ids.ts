import * as v from "valibot";

export const PlatformRole = v.picklist(["user", "admin"]);
export type PlatformRole = v.InferOutput<typeof PlatformRole>;

//////////////
// Projects //
//////////////

export const ProjectId = v.pipe(v.string(), v.cuid2(), v.brand("ProjectId"));
export type ProjectId = v.InferOutput<typeof ProjectId>;

export const KeyId = v.pipe(v.string(), v.cuid2(), v.brand("KeyId"));
export type KeyId = v.InferOutput<typeof KeyId>;

//////////
// Logs //
//////////

export const LogId = v.pipe(v.string(), v.cuid2(), v.brand("LogId"));
export type LogId = v.InferOutput<typeof LogId>;

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

////////////
// Kanban //
////////////

export const BoardId = v.pipe(v.string(), v.cuid2(), v.brand("BoardId"));
export type BoardId = v.InferOutput<typeof BoardId>;

export const ColumnId = v.pipe(v.string(), v.cuid2(), v.brand("ColumnId"));
export type ColumnId = v.InferOutput<typeof ColumnId>;

export const CardId = v.pipe(v.string(), v.cuid2(), v.brand("CardId"));
export type CardId = v.InferOutput<typeof CardId>;

export const CardAssigneeId = v.pipe(
	v.string(),
	v.cuid2(),
	v.brand("CardAssigneeId"),
);
export type CardAssigneeId = v.InferOutput<typeof CardAssigneeId>;
