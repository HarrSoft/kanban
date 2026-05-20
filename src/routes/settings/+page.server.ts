import { fail, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import * as v from "valibot";
import * as argon2 from "argon2";
import type { Actions, PageServerLoad } from "./$types";
import db from "$db";
import { users, passwords } from "$db/schema";

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session;
	if (!session) {
		redirect(302, "/login");
	}

	const [user] = await db
		.select({
			id: users.id,
			email: users.email,
			name: users.name,
			bio: users.bio,
			imageUrl: users.imageUrl,
		})
		.from(users)
		.where(eq(users.id, session.userId));

	if (!user) {
		redirect(302, "/login");
	}

	return { user };
};

const profileSchema = v.object({
	name: v.optional(v.pipe(v.string(), v.maxLength(100)), ""),
	bio: v.optional(v.pipe(v.string(), v.maxLength(500)), ""),
	email: v.pipe(v.string(), v.email()),
});

const passwordSchema = v.object({
	currentPassword: v.pipe(v.string(), v.minLength(1)),
	newPassword: v.pipe(v.string(), v.minLength(8), v.maxLength(128)),
	confirmPassword: v.pipe(v.string(), v.minLength(1)),
});

export const actions: Actions = {
	updateProfile: async ({ locals, request }) => {
		const session = locals.session;
		if (!session) {
			return fail(401, { profileError: "Not authenticated" });
		}

		const formData = Object.fromEntries(await request.formData());
		const parsed = v.safeParse(profileSchema, {
			name: formData.name || "",
			bio: formData.bio || "",
			email: formData.email || "",
		});

		if (!parsed.success) {
			const issues = parsed.issues.map(i => i.message).join(", ");
			return fail(400, { profileError: issues });
		}

		const { name, bio, email } = parsed.output;

		// Check email uniqueness (exclude current user)
		const [existing] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, email));

		if (existing && existing.id !== session.userId) {
			return fail(409, { profileError: "Email already in use by another account" });
		}

		await db
			.update(users)
			.set({
				name: name || null,
				bio: bio || null,
				email,
				updatedAt: Math.floor(Date.now() / 1000),
			})
			.where(eq(users.id, session.userId));

		return { profileSuccess: "Profile updated" };
	},

	changePassword: async ({ locals, request }) => {
		const session = locals.session;
		if (!session) {
			return fail(401, { passwordError: "Not authenticated" });
		}

		const formData = Object.fromEntries(await request.formData());
		const parsed = v.safeParse(passwordSchema, {
			currentPassword: formData.currentPassword || "",
			newPassword: formData.newPassword || "",
			confirmPassword: formData.confirmPassword || "",
		});

		if (!parsed.success) {
			const issues = parsed.issues.map(i => i.message).join(", ");
			return fail(400, { passwordError: issues });
		}

		const { currentPassword, newPassword, confirmPassword } = parsed.output;

		if (newPassword !== confirmPassword) {
			return fail(400, { passwordError: "New passwords do not match" });
		}

		// Verify current password
		const [stored] = await db
			.select({ hash: passwords.hash })
			.from(passwords)
			.where(eq(passwords.userId, session.userId));

		if (!stored) {
			return fail(400, { passwordError: "No password set for this account" });
		}

		const valid = await argon2.verify(stored.hash, currentPassword);
		if (!valid) {
			return fail(403, { passwordError: "Current password is incorrect" });
		}

		// Hash and update new password
		const newHash = await argon2.hash(newPassword);

		await db
			.update(passwords)
			.set({ hash: newHash, updatedAt: Math.floor(Date.now() / 1000) })
			.where(eq(passwords.userId, session.userId));

		return { passwordSuccess: "Password changed" };
	},
};
