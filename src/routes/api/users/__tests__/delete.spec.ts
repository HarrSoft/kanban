import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { UserId } from "$types";

/**
 * Input validation tests for POST /api/users/delete
 *
 * These validate the Valibot schema used as the input parser (same UserId schema).
 * Full integration tests (live DB queries, auth checks) belong in e2e/.
 *
 * NOTE: v.cuid2() validates that the string starts with a lowercase letter
 * followed by zero or more lowercase letters or digits (/^[a-z][\da-z]*$/u).
 * It does NOT enforce length — cuid2 IDs are variable-length by design.
 */

describe("POST /api/users/delete — input validation", () => {
	it("accepts a valid cuid2 string", () => {
		const input = v.parse(UserId, "e8u0vgefq61c45dvfp4v7zgj");
		expect(input).toBe("e8u0vgefq61c45dvfp4v7zgj");
	});

	it("rejects an empty string", () => {
		expect(() => v.parse(UserId, "")).toThrow();
	});

	it("rejects a number", () => {
		expect(() => v.parse(UserId, 123 as unknown as string)).toThrow();
	});

	it("rejects null", () => {
		expect(() => v.parse(UserId, null as unknown as string)).toThrow();
	});

	it("rejects a string with special chars", () => {
		expect(() => v.parse(UserId, "'; DROP TABLE users; --")).toThrow();
	});

	it("rejects an array", () => {
		expect(() =>
			v.parse(UserId, ["validuserid123"] as unknown as string),
		).toThrow();
	});

	it("rejects a boolean", () => {
		expect(() => v.parse(UserId, true as unknown as string)).toThrow();
	});

	it("rejects a string starting with a digit", () => {
		expect(() => v.parse(UserId, "0abc")).toThrow();
	});

	it("rejects a string with uppercase letters", () => {
		expect(() => v.parse(UserId, "ABCdef")).toThrow();
	});

	it("accepts a valid single-letter cuid2 (allowed by regex)", () => {
		const input = v.parse(UserId, "x");
		expect(input).toBe("x");
	});
});
