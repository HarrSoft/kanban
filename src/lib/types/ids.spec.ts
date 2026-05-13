import { describe, it, expect } from "vitest";
import * as v from "valibot";
import {
	BoardId,
	ColumnId,
	CardId,
	ProjectId,
	UserId,
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
		const id: v.InferOutput<typeof BoardId> = v.parse(BoardId, "clxabcdef1234567890abcdef");
		const str: string = id;
		expect(str).toBe(id);
	});
});
