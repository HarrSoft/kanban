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

	it("accepts plus sign (unbounded regex match)", () => {
		// Note: the current regex is [A-Za-z0-9-_]* without anchors,
		// so "ab+c" partially matches. Consider adding ^...$ anchors
		// if strict matching is desired.
		expect(v.parse(Base64Url, "ab+c")).toBe("ab+c");
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
