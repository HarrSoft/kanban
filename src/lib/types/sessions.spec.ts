/**
 * Unit tests for Session Valibot schema.
 */

import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { Session } from "./sessions";

describe("Session schema", () => {
	const validCuid = "clxabcdef1234567890abcdef";
	const validSession = {
		sessionId: validCuid,
		userId: validCuid,
		userEmail: "user@example.com",
		platformRole: "user",
		expiresAt: 1700000000,
	};

	it("accepts a valid session", () => {
		const result = v.safeParse(Session, validSession);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.output.userEmail).toBe("user@example.com");
		}
	});

	it("accepts admin platform role", () => {
		const admin = { ...validSession, platformRole: "admin" };
		const result = v.safeParse(Session, admin);
		expect(result.success).toBe(true);
	});

	it("rejects invalid email", () => {
		const bad = { ...validSession, userEmail: "not-an-email" };
		const result = v.safeParse(Session, bad);
		expect(result.success).toBe(false);
	});

	it("rejects unknown platform role", () => {
		const bad = { ...validSession, platformRole: "superadmin" };
		const result = v.safeParse(Session, bad);
		expect(result.success).toBe(false);
	});

	it("rejects null sessionId", () => {
		const bad = { ...validSession, sessionId: null };
		const result = v.safeParse(Session, bad);
		expect(result.success).toBe(false);
	});

	it("rejects missing userId", () => {
		const { userId, ...rest } = validSession;
		const result = v.safeParse(Session, rest);
		expect(result.success).toBe(false);
	});

	it("allows negative expiresAt (schema currently lacks min-value constraint)", () => {
		// Unix is v.number() without min — negative passes
		const bad = { ...validSession, expiresAt: -1 };
		const result = v.safeParse(Session, bad);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.output.expiresAt).toBe(-1);
		}
	});
});
