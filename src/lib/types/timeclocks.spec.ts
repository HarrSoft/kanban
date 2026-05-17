/**
 * Unit tests for Timeclock Valibot schema.
 */

import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { Timeclock } from "./timeclocks";

describe("Timeclock schema", () => {
	const validCuid = "clxabcdef1234567890abcdef";
	const validTimeclock = {
		id: validCuid,
		projectId: validCuid,
		userId: validCuid,
		start: 1700000000,
		duration: 3600,
		locked: false,
	};

	it("accepts a valid unlocked timeclock", () => {
		const result = v.safeParse(Timeclock, validTimeclock);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.output.duration).toBe(3600);
			expect(result.output.locked).toBe(false);
		}
	});

	it("accepts a locked timeclock", () => {
		const locked = { ...validTimeclock, locked: true };
		const result = v.safeParse(Timeclock, locked);
		expect(result.success).toBe(true);
	});

	it("accepts zero duration", () => {
		const zero = { ...validTimeclock, duration: 0 };
		const result = v.safeParse(Timeclock, zero);
		expect(result.success).toBe(true);
	});

	it("rejects string duration", () => {
		const bad = { ...validTimeclock, duration: "3600" };
		const result = v.safeParse(Timeclock, bad);
		expect(result.success).toBe(false);
	});

	it("rejects missing projectId", () => {
		const { projectId, ...rest } = validTimeclock;
		const result = v.safeParse(Timeclock, rest);
		expect(result.success).toBe(false);
	});

	it("rejects missing userId", () => {
		const { userId, ...rest } = validTimeclock;
		const result = v.safeParse(Timeclock, rest);
		expect(result.success).toBe(false);
	});

	it("rejects missing id", () => {
		const { id, ...rest } = validTimeclock;
		const result = v.safeParse(Timeclock, rest);
		expect(result.success).toBe(false);
	});

	it("rejects non-boolean locked", () => {
		const bad = { ...validTimeclock, locked: "yes" };
		const result = v.safeParse(Timeclock, bad);
		expect(result.success).toBe(false);
	});

	it("allows negative start time (schema currently lacks min-value constraint)", () => {
		// Unix is v.number() without min — negative passes
		const bad = { ...validTimeclock, start: -100 };
		const result = v.safeParse(Timeclock, bad);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.output.start).toBe(-100);
		}
	});
});
