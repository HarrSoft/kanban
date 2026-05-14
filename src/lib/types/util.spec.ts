import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { Base64, Base64Url, Seconds, Unix } from "./util";

describe("Base64", () => {
	it("accepts a valid base64 string", () => {
		expect(v.parse(Base64, "SGVsbG8=")).toBe("SGVsbG8=");
	});

	it("rejects base64 without padding", () => {
		expect(() => v.parse(Base64, "SGVsbG8")).toThrow();
	});

	it("rejects a string with invalid characters", () => {
		expect(() => v.parse(Base64, "Hello!!!")).toThrow();
	});
});

describe("Base64Url", () => {
	it("accepts a valid base64url string", () => {
		expect(v.parse(Base64Url, "SGVsbG8")).toBe("SGVsbG8");
	});

	it("allows hyphens and underscores", () => {
		expect(v.parse(Base64Url, "abc-123_def")).toBe("abc-123_def");
	});

	it("rejects plus sign (non-base64url char)", () => {
		expect(() => v.parse(Base64Url, "ab+c")).toThrow();
	});

	it("rejects spaces", () => {
		expect(() => v.parse(Base64Url, "abc def")).toThrow();
	});

	it("empty string passes regex (zero-length match with *)", () => {
		// Note: regex /^[A-Za-z0-9\\-_]*$/ matches empty string because *
		// allows zero occurrences. Change * to + for non-empty enforcement.
		expect(v.parse(Base64Url, "")).toBe("");
	});

	it("rejects strings with only non-base64url characters", () => {
		expect(() => v.parse(Base64Url, "!!!")).toThrow();
	});
});

describe("Seconds", () => {
	it("accepts a number", () => {
		expect(v.parse(Seconds, 42)).toBe(42);
	});

	it("rejects a string", () => {
		expect(() => v.parse(Seconds, "42")).toThrow();
	});
});

describe("Unix", () => {
	it("accepts a number", () => {
		expect(v.parse(Unix, 1700000000)).toBe(1700000000);
	});

	it("rejects a string", () => {
		expect(() => v.parse(Unix, "1700000000")).toThrow();
	});
});
