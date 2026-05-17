/**
 * Unit tests for User-related Valibot schemas.
 */

import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { UserInfo, UserProfile, UserInvite } from "./users";

describe("UserInfo schema", () => {
	const validCuid = "clxabcdef1234567890abcdef";
	const validUser = {
		id: validCuid,
		name: "Alice",
		email: "alice@example.com",
		platformRole: "user",
		imageUrl: null,
	};

	it("accepts a valid user with name and null image", () => {
		const result = v.safeParse(UserInfo, validUser);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.output.email).toBe("alice@example.com");
		}
	});

	it("accepts null name", () => {
		const user = { ...validUser, name: null };
		const result = v.safeParse(UserInfo, user);
		expect(result.success).toBe(true);
	});

	it("accepts a valid URL image", () => {
		const user = { ...validUser, imageUrl: "https://example.com/avatar.png" };
		const result = v.safeParse(UserInfo, user);
		expect(result.success).toBe(true);
	});

	it("rejects invalid email", () => {
		const user = { ...validUser, email: "not-email" };
		const result = v.safeParse(UserInfo, user);
		expect(result.success).toBe(false);
	});

	it("rejects invalid image URL", () => {
		const user = { ...validUser, imageUrl: "not-a-url" };
		const result = v.safeParse(UserInfo, user);
		expect(result.success).toBe(false);
	});

	it("rejects unknown platform role", () => {
		const user = { ...validUser, platformRole: "superadmin" };
		const result = v.safeParse(UserInfo, user);
		expect(result.success).toBe(false);
	});

	it("rejects missing email", () => {
		const { email, ...rest } = validUser;
		const result = v.safeParse(UserInfo, rest);
		expect(result.success).toBe(false);
	});
});

describe("UserProfile schema", () => {
	const validCuid = "clxabcdef1234567890abcdef";
	const validProfile = {
		id: validCuid,
		name: "Bob",
		email: "bob@example.com",
		platformRole: "user",
		imageUrl: null,
		verified: true,
		bio: null,
	};

	it("accepts a valid profile", () => {
		const result = v.safeParse(UserProfile, validProfile);
		expect(result.success).toBe(true);
	});

	it("accepts a profile with bio", () => {
		const profile = { ...validProfile, bio: "Full-stack developer" };
		const result = v.safeParse(UserProfile, profile);
		expect(result.success).toBe(true);
	});

	it("rejects missing verified field", () => {
		const { verified, ...rest } = validProfile;
		const result = v.safeParse(UserProfile, rest);
		expect(result.success).toBe(false);
	});

	it("rejects non-boolean verified", () => {
		const profile = { ...validProfile, verified: "yes" };
		const result = v.safeParse(UserProfile, profile);
		expect(result.success).toBe(false);
	});
});

describe("UserInvite schema", () => {
	const validInvite = {
		email: "invited@example.com",
		code: "INVITE-CODE-123",
		platformRole: "user",
		expiresAt: 1700000000,
	};

	it("accepts a valid invite", () => {
		const result = v.safeParse(UserInvite, validInvite);
		expect(result.success).toBe(true);
	});

	it("accepts admin platform role", () => {
		const invite = { ...validInvite, platformRole: "admin" };
		const result = v.safeParse(UserInvite, invite);
		expect(result.success).toBe(true);
	});

	it("rejects invalid email", () => {
		const invite = { ...validInvite, email: "bad" };
		const result = v.safeParse(UserInvite, invite);
		expect(result.success).toBe(false);
	});

	it("rejects unknown platform role", () => {
		const invite = { ...validInvite, platformRole: "owner" };
		const result = v.safeParse(UserInvite, invite);
		expect(result.success).toBe(false);
	});

	it("rejects missing code", () => {
		const { code, ...rest } = validInvite;
		const result = v.safeParse(UserInvite, rest);
		expect(result.success).toBe(false);
	});
});
