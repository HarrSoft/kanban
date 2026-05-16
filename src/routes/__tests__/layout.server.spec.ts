/**
 * Unit tests for the root layout server load function.
 *
 * Validates that the load function returns the session from locals
 * (or null when no session exists).
 *
 * Full request integration testing belongs in e2e/ with Playwright.
 */

import { describe, it, expect } from "vitest";
import { load } from "../+layout.server";
import type { LayoutServerLoadEvent } from "./$types";

describe("root layout server load", () => {
	it("returns null session when locals.session is undefined", async () => {
		const event = {
			locals: {},
		} as LayoutServerLoadEvent;

		const result = await load(event);
		expect(result).toEqual({ session: null });
	});

	it("returns session when locals.session is set", async () => {
		const mockSession = {
			sessionId: "e8u0vgefq61c45dvfp4v7zgj",
			userId: "g6pn2hthq2l5dz7sbs5ocqmm",
			userEmail: "test@harrsoft.coop",
			expiresAt: Math.floor(Date.now() / 1000) + 86400,
			platformRole: "user" as const,
		};

		const event = {
			locals: { session: mockSession },
		} as unknown as LayoutServerLoadEvent;

		const result = await load(event);
		expect(result).toEqual({ session: mockSession });
	});

	it("is an async function", () => {
		expect(load.constructor.name).toBe("AsyncFunction");
	});
});
