import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { UserId } from "$types";

/**
 * Input validation tests for GET /api/users
 *
 * These validate the Valibot schema used as the input parser.
 * Full integration tests (live DB queries) belong in e2e/.
 *
 * NOTE: v.cuid2() validates that the string starts with a lowercase letter
 * followed by zero or more lowercase letters or digits (/^[a-z][\da-z]*$/u).
 * It does NOT enforce length — cuid2 IDs are variable-length by design.
 */

describe("GET /api/users — input validation", () => {
	it("accepts a valid cuid2 string", () => {
		const input = v.parse(UserId, "e8u0vgefq61c45dvfp4v7zgj");
		expect(input).toBe("e8u0vgefq61c45dvfp4v7zgj");
	});

	it("rejects an empty string", () => {
		expect(() => v.parse(UserId, "")).toThrow();
	});

	it("rejects a number", () => {
		expect(() => v.parse(UserId, 42 as unknown as string)).toThrow();
	});

	it("rejects null", () => {
		expect(() => v.parse(UserId, null as unknown as string)).toThrow();
	});

	it("rejects undefined", () => {
		expect(() => v.parse(UserId, undefined as unknown as string)).toThrow();
	});

	it("rejects a string starting with a digit", () => {
		expect(() => v.parse(UserId, "1abc")).toThrow();
	});

	it("rejects a string with special characters", () => {
		expect(() => v.parse(UserId, "<script>alert('xss')</script>")).toThrow();
	});

	it("rejects a UUID format (not a cuid2)", () => {
		expect(() =>
			v.parse(UserId, "550e8400-e29b-41d4-a716-446655440000"),
		).toThrow();
	});

	it("rejects a string starting with uppercase", () => {
		expect(() => v.parse(UserId, "Abcdefgh")).toThrow();
	});

	it("rejects a string with hyphens", () => {
		expect(() => v.parse(UserId, "abc-def")).toThrow();
	});

	it("accepts a very long valid cuid2 string (cuid2 allows variable length)", () => {
		const input = v.parse(UserId, "a" + "b".repeat(199));
		expect(input.length).toBe(200);
	});
});
