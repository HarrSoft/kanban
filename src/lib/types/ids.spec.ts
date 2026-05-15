import { describe, it, expect } from "vitest";
import * as v from "valibot";
import {
	BoardId,
	ColumnId,
	CardId,
	ProjectId,
	UserId,
	KeyId,
	LogId,
	SessionId,
	TicketId,
	TimeclockId,
	PlatformRole,
} from "./ids";

describe("PlatformRole", () => {
	it("accepts 'user'", () => {
		expect(v.parse(PlatformRole, "user")).toBe("user");
	});

	it("accepts 'admin'", () => {
		expect(v.parse(PlatformRole, "admin")).toBe("admin");
	});

	it("rejects unknown roles", () => {
		expect(() => v.parse(PlatformRole, "superadmin")).toThrow();
	});
});

describe("Branded ID schemas", () => {
	const validCuid = "clxabcdef1234567890abcdef"; // 24-char lowercase alphanumeric

	it("BoardId accepts a valid cuid2 string", () => {
		const result = v.parse(BoardId, validCuid);
		expect(result).toBe(validCuid);
	});

	it("BoardId rejects a short string", () => {
		expect(() => v.parse(BoardId, "too-short")).toThrow();
	});

	it("BoardId rejects an empty string", () => {
		expect(() => v.parse(BoardId, "")).toThrow();
	});

	it("ColumnId accepts a valid cuid2 string", () => {
		expect(v.parse(ColumnId, validCuid)).toBe(validCuid);
	});

	it("CardId accepts a valid cuid2 string", () => {
		expect(v.parse(CardId, validCuid)).toBe(validCuid);
	});

	it("ProjectId accepts a valid cuid2 string", () => {
		expect(v.parse(ProjectId, validCuid)).toBe(validCuid);
	});

	it("UserId accepts a valid cuid2 string", () => {
		expect(v.parse(UserId, validCuid)).toBe(validCuid);
	});

	it("brand types are discriminant at type level", () => {
		const board: v.InferOutput<typeof BoardId> = v.parse(BoardId, validCuid);
		const column: v.InferOutput<typeof ColumnId> = v.parse(ColumnId, validCuid);

		// Both are strings at runtime
		expect(typeof board).toBe("string");
		expect(typeof column).toBe("string");
	});
});

describe("ID brand type inference", () => {
	it("BoardId branded value is assignable to string", () => {
		const id: v.InferOutput<typeof BoardId> = v.parse(
			BoardId,
			"clxabcdef1234567890abcdef",
		);
		const str: string = id;
		expect(str).toBe(id);
	});
});

describe("Additional ID schemas", () => {
	const validCuid = "clxabcdef1234567890abcdef";

	it("KeyId accepts a valid cuid2 string", () => {
		expect(v.parse(KeyId, validCuid)).toBe(validCuid);
	});

	it("KeyId rejects an empty string", () => {
		expect(() => v.parse(KeyId, "")).toThrow();
	});

	it("LogId accepts a valid cuid2 string", () => {
		expect(v.parse(LogId, validCuid)).toBe(validCuid);
	});

	it("LogId rejects an empty string", () => {
		expect(() => v.parse(LogId, "")).toThrow();
	});

	it("SessionId accepts a valid cuid2 string", () => {
		expect(v.parse(SessionId, validCuid)).toBe(validCuid);
	});

	it("SessionId rejects an empty string", () => {
		expect(() => v.parse(SessionId, "")).toThrow();
	});

	it("TicketId accepts a valid cuid2 string", () => {
		expect(v.parse(TicketId, validCuid)).toBe(validCuid);
	});

	it("TicketId rejects an empty string", () => {
		expect(() => v.parse(TicketId, "")).toThrow();
	});

	it("TimeclockId accepts a valid cuid2 string", () => {
		expect(v.parse(TimeclockId, validCuid)).toBe(validCuid);
	});

	it("TimeclockId rejects an empty string", () => {
		expect(() => v.parse(TimeclockId, "")).toThrow();
	});

	it("ProjectId rejects invalid characters (uppercase)", () => {
		expect(() => v.parse(ProjectId, "CLXABCDEF1234567890ABCDEF")).toThrow();
	});

	it("BoardId rejects a string with special chars", () => {
		expect(() => v.parse(BoardId, "clxabcd!!!!!!567890abcdef")).toThrow();
	});

	it("ColumnId rejects a string with special chars", () => {
		expect(() => v.parse(ColumnId, "clxabcd!!!!!!567890abcdef")).toThrow();
	});

	it("CardId rejects a string with special chars", () => {
		expect(() => v.parse(CardId, "clxabcd!!!!!!567890abcdef")).toThrow();
	});
});
