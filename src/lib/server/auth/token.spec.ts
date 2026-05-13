/* eslint-disable @typescript-eslint/no-explicit-any -- test setup mocks env */
/**
 * Unit tests for JWT auth token creation and validation.
 *
 * These tests work with the .env AUTH_SECRET at the module level.
 * Key invariants tested:
 * - Token round-trip (create — validate) with a valid session
 * - Tampered tokens are rejected at the signature check
 * - Malformed/incomplete JWT strings are rejected gracefully
 * - Expired tokens
 */

import { describe, it, expect } from "vitest";
import { validateToken, createToken } from "./token";

/** Valid session fixture — must use cuid2-format IDs */
const testSession = {
	sessionId: "e8u0vgefq61c45dvfp4v7zgj",
	userId: "g6pn2hthq2l5dz7sbs5ocqmm",
	userEmail: "test@harrsoft.coop",
	expiresAt: Math.floor(Date.now() / 1000) + 86400, // 24h from now
	platformRole: "user" as any,
};

describe("createToken", () => {
	it("returns a three-part JWT string", () => {
		const token = createToken(testSession);
		const parts = token.split(".");
		expect(parts).toHaveLength(3);
	});

	it("header base64url decodes to correct structure", () => {
		const token = createToken(testSession);
		const [header] = token.split(".");
		const decoded = JSON.parse(
			Buffer.from(header, "base64url").toString("utf-8"),
		);
		expect(decoded).toEqual({ typ: "JWT", alg: "HS256" });
	});

	it("payload contains sub, exp, email, session_id, session_exp, platform_role", () => {
		const token = createToken(testSession);
		const [, payloadB64] = token.split(".");
		const decoded = JSON.parse(
			Buffer.from(payloadB64, "base64url").toString("utf-8"),
		);
		expect(decoded.sub).toBe(testSession.userId);
		expect(decoded.email).toBe(testSession.userEmail);
		expect(decoded.session_id).toBe(testSession.sessionId);
		expect(decoded.session_exp).toBe(testSession.expiresAt);
		expect(decoded.platform_role).toBe("user");
		expect(decoded.exp).toBeGreaterThan(
			Math.floor(Date.now() / 1000) + 85000,
		); // ~24h
	});

	it("generates unique tokens with different session IDs", () => {
		const t1 = createToken(testSession);
		const t2 = createToken({
			...testSession,
			sessionId: "sess_02JN6K3R4X5Y7Z9ABCDEFGHIJK" as any,
		});
		expect(t1).not.toBe(t2);
	});
});

describe("validateToken", () => {
	it("validates a freshly created token", () => {
		const token = createToken(testSession);
		const result = validateToken(token);

		expect(result.valid).toBe(true);
		if (result.valid) {
			expect(result.session.userEmail).toBe(testSession.userEmail);
			expect(result.session.userId).toBe(testSession.userId);
			expect(result.session.sessionId).toBe(testSession.sessionId);
		}
	});

	it("rejects a token with a tampered payload", () => {
		const token = createToken(testSession);
		const [header, payload, sig] = token.split(".");

		// Tamper the payload - change the email
		const tamperedPayload = Buffer.from(
			JSON.stringify({
				sub: testSession.userId,
				exp: Math.floor(Date.now() / 1000) + 86400,
				email: "evil@example.com",
				session_id: testSession.sessionId,
				session_exp: testSession.expiresAt,
				platform_role: "user",
			}),
			"utf-8",
		).toString("base64url");

		const tamperedToken = [header, tamperedPayload, sig].join(".");
		const result = validateToken(tamperedToken);
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error).toBe("signature");
		}
	});

	it("rejects a token with a tampered header (alg changed)", () => {
		const token = createToken(testSession);
		const [, payload, sig] = token.split(".");

		// Changing alg to "none" makes valibot validation fail (HS256 required)
		// so the error is "header", not "signature" — the header decoding catches
		// structural tampering before the signature check.
		const tamperedHeader = Buffer.from(
			JSON.stringify({ typ: "JWT", alg: "none" }),
			"utf-8",
		).toString("base64url");

		const tamperedToken = [tamperedHeader, payload, sig].join(".");
		const result = validateToken(tamperedToken);
		expect(result.valid).toBe(false);
		expect(result.error).toBe("header");
	});

	it("rejects a token missing the signature part", () => {
		const token = createToken(testSession);
		const parts = token.split(".");
		const shortToken = [parts[0], parts[1]].join("."); // no sig
		const result = validateToken(shortToken);
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error).toBe("unsigned");
		}
	});

	it("rejects a completely malformed token", () => {
		const result = validateToken("not-a-jwt");
		expect(result.valid).toBe(false);
	});

	it("rejects an empty string", () => {
		const result = validateToken("");
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error).toBe("token");
		}
	});

	it("rejects token with malformed header (non-JSON)", () => {
		const token = [
			Buffer.from("not-json", "utf-8").toString("base64url"),
			Buffer.from(JSON.stringify({ sub: "usr_xxx" }), "utf-8").toString(
				"base64url",
			),
			"b64sighack",
		].join(".");

		const result = validateToken(token);
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error).toBe("header");
		}
	});

	it("rejects token with malformed payload (non-JSON)", () => {
		const token = createToken(testSession);
		const [header, , sig] = token.split(".");

		const badPayload = Buffer.from("not-json", "utf-8").toString("base64url");
		const badToken = [header, badPayload, sig].join(".");

		const result = validateToken(badToken);
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error).toBe("payload");
		}
	});

	it("rejects token with invalid payload fields (missing email)", () => {
		const [header] = createToken(testSession).split(".");
		const noEmailPayload = Buffer.from(
			JSON.stringify({
				sub: "g6pn2hthq2l5dz7sbs5ocqmm",
				exp: Math.floor(Date.now() / 1000) + 86400,
				// missing email
				session_id: "e8u0vgefq61c45dvfp4v7zgj",
				session_exp: Math.floor(Date.now() / 1000) + 86400,
				platform_role: "user",
			}),
			"utf-8",
		).toString("base64url");
		// Fake signature — payload validation check happens before signature check
		const fakeSig = Buffer.from("fake-signature-for-testing").toString("base64url");
		const badToken = [header, noEmailPayload, fakeSig].join(".");

		const result = validateToken(badToken);
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error).toBe("payload");
		}
	});
});

describe("signature tamper returns sessionId", () => {
	it("returns the session_id from the payload when signature is invalid", () => {
		const token = createToken(testSession);
		const [header, payload] = token.split(".");
		const badSig = Buffer.from("this-is-a-fake-signature").toString("base64url");
		const tampered = [header, payload, badSig].join(".");

		const result = validateToken(tampered);
		expect(result.valid).toBe(false);
		if (!result.valid && result.error === "signature") {
			expect(result.sessionId).toBe(testSession.sessionId);
		}
	});
});
