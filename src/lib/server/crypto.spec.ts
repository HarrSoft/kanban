import { describe, it, expect } from "vitest";
import { cuid2 } from "./crypto";

describe("cuid2", () => {
	it("generates a string of the expected length", () => {
		const id = cuid2();
		expect(typeof id).toBe("string");
		expect(id.length).toBe(24);
	});

	it("generates unique IDs on successive calls", () => {
		const id1 = cuid2();
		const id2 = cuid2();
		expect(id1).not.toBe(id2);
	});

	it("generates IDs matching cuid2 format (lowercase alphanumeric)", () => {
		const id = cuid2();
		expect(id).toMatch(/^[a-z0-9]+$/);
	});
});
