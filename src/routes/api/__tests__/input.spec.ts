/**
 * Unit tests for API route Input validation schemas.
 *
 * These tests validate the Valibot parsers used by API endpoints
 * and don't require a database connection.
 */
import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { Input as UserDeleteInput } from "../users/delete";
import { Input as UserGetInput } from "../users/get";
import { ProjectId } from "$types/ids";

describe("User delete Input schema", () => {
	it("accepts a valid UserId (cuid2 string)", () => {
		const result = v.parse(UserDeleteInput, "clxabcdef1234567890abcdef");
		expect(result).toBe("clxabcdef1234567890abcdef");
	});

	it("rejects an empty string", () => {
		expect(() => v.parse(UserDeleteInput, "")).toThrow();
	});

	it("rejects a short string", () => {
		expect(() => v.parse(UserDeleteInput, "too-short")).toThrow();
	});

	it("rejects null", () => {
		expect(() => v.parse(UserDeleteInput, null)).toThrow();
	});

	it("rejects undefined", () => {
		expect(() => v.parse(UserDeleteInput, undefined)).toThrow();
	});

	it("rejects non-string types (numbers)", () => {
		expect(() => v.parse(UserDeleteInput, 42)).toThrow();
	});
});

describe("User get Input schema", () => {
	it("accepts a valid UserId", () => {
		const result = v.parse(UserGetInput, "clxabcdef1234567890abcdef");
		expect(result).toBe("clxabcdef1234567890abcdef");
	});

	it("rejects invalid input", () => {
		expect(() => v.parse(UserGetInput, "")).toThrow();
	});
});

describe("ProjectId validation (reused in boards API)", () => {
	it("accepts a valid ProjectId", () => {
		const result = v.parse(ProjectId, "clxabcdef1234567890abcdef");
		expect(result).toBe("clxabcdef1234567890abcdef");
	});

	it("rejects invalid characters", () => {
		expect(() => v.parse(ProjectId, "CLXABCDEF1234567890ABCDEF")).toThrow();
	});

	it("rejects special characters", () => {
		expect(() => v.parse(ProjectId, "clxabcd!!!!!!567890abcdef")).toThrow();
	});
});
