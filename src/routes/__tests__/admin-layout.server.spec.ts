/**
 * Unit tests for the admin layout server guard.
 *
 * Validates that unauthenticated visitors are redirected to /login,
 * non-admin sessions are rejected with 403, and admin sessions pass through.
 *
 * Full request integration testing belongs in e2e/ with Playwright.
 */

import { describe, it, expect } from "vitest";
import { load } from "../admin/+layout.server";

type MockLoadEvent = {
	locals: {
		session?: {
			sessionId: string;
			userId: string;
			userEmail: string;
			expiresAt: number;
			platformRole: "user" | "admin";
		};
	};
};

const adminSession = {
	sessionId: "e8u0vgefq61c45dvfp4v7zgj",
	userId: "g6pn2hthq2l5dz7sbs5ocqmm",
	userEmail: "admin@harrsoft.coop",
	expiresAt: Math.floor(Date.now() / 1000) + 86400,
	platformRole: "admin" as const,
};

describe("admin layout server guard", () => {
	it("redirects to /login when no session", async () => {
		const event: MockLoadEvent = { locals: {} };

		await expect(
			load(event as Parameters<typeof load>[0]),
		).rejects.toMatchObject({
			status: 302,
			location: "/login",
		});
	});

	it("throws 403 for a non-admin session", async () => {
		const event: MockLoadEvent = {
			locals: { session: { ...adminSession, platformRole: "user" } },
		};

		await expect(
			load(event as Parameters<typeof load>[0]),
		).rejects.toMatchObject({
			status: 403,
		});
	});

	it("returns the session for an admin", async () => {
		const event: MockLoadEvent = { locals: { session: adminSession } };

		const result = await load(event as Parameters<typeof load>[0]);
		expect(result).toEqual({ session: adminSession });
	});
});
