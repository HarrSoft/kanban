/**
 * Unit tests for the DB schema utility functions.
 *
 * Tests cover the cuid2-based id generator, timestamp field factories,
 * and unix/time helpers. These are pure functions (aside from cuid2
 * initialization) and do not require a database connection.
 */

import { describe, it, expect } from "vitest";
import { id, seconds, unix, unixNow, timestamps } from "./util";

describe("id generator", () => {
	it("returns a non-empty function", () => {
		expect(typeof id).toBe("function");
	});

	it("returns a column factory that produces text columns", () => {
		const column = id("test_id");
		expect(column).toBeDefined();
		expect((column as any).config.name).toBe("test_id");
	});
});

describe("seconds helper", () => {
	it("returns a function that produces integer columns", () => {
		const column = seconds("duration");
		expect(column).toBeDefined();
		expect((column as any).config.name).toBe("duration");
	});
});

describe("unix helper", () => {
	it("returns a function that produces bigint columns", () => {
		const column = unix("created_at");
		expect(column).toBeDefined();
		expect((column as any).config.name).toBe("created_at");
	});
});

describe("unixNow", () => {
	it("returns a positive number", () => {
		const now = unixNow();
		expect(typeof now).toBe("number");
		expect(now).toBeGreaterThan(1_700_000_000);
	});

	it("increases over time (eventually)", async () => {
		const a = unixNow();
		await new Promise(r => setTimeout(r, 5));
		const b = unixNow();
		expect(b).toBeGreaterThanOrEqual(a);
	});
});

describe("timestamps schema", () => {
	it("has createdAt, updatedAt, and deletedAt fields", () => {
		expect(timestamps).toHaveProperty("createdAt");
		expect(timestamps).toHaveProperty("updatedAt");
		expect(timestamps).toHaveProperty("deletedAt");
	});

	it("createdAt column config name is created_at", () => {
		expect((timestamps.createdAt as any).config.name).toBe("created_at");
	});

	it("updatedAt column config name is updated_at", () => {
		expect((timestamps.updatedAt as any).config.name).toBe("updated_at");
	});

	it("deletedAt column config name is deleted_at", () => {
		expect((timestamps.deletedAt as any).config.name).toBe("deleted_at");
	});

	it("createdAt is notNull and has a default", () => {
		const cfg = (timestamps.createdAt as any).config;
		expect(cfg.notNull).toBe(true);
		expect(cfg.hasDefault).toBe(true);
	});

	it("updatedAt is notNull and has onUpdate", () => {
		expect((timestamps.updatedAt as any).config.notNull).toBe(true);
		expect((timestamps.updatedAt as any).$onUpdate).toBeDefined();
	});

	it("deletedAt is nullable (no value constraints)", () => {
		expect((timestamps.deletedAt as any).config.notNull).toBe(false);
	});

	it("createdAt dataType is number (bigint mode)", () => {
		expect((timestamps.createdAt as any).config.dataType).toBe("number");
	});
});
