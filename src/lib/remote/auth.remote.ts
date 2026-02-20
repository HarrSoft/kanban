import * as argon2 from "argon2";
import { eq } from "drizzle-orm";
import * as v from "valibot";
import { error, invalid, redirect } from "@sveltejs/kit";
import { form, getRequestEvent, query } from "$app/server";
import db, { passwords, users } from "$db";
import {
	setSessionTokenCookie,
	deleteSessionTokenCookie,
} from "$server/auth/cookie";
import { createSession, invalidateSession } from "$server/auth/session";
import { createToken } from "$server/auth/token";

//////////////////////
// getSession query //
//////////////////////

export const getSession = query(() => {
	const event = getRequestEvent();
	return event.locals.session;
});

////////////////
// login form //
////////////////

export const login = form(
	v.object({
		email: v.pipe(v.string(), v.email()),
		_password: v.string(),
	}),
	async ({ email, _password }, issues) => {
		const session = await db.transaction(async tx => {
			const [pwRecord] = await tx
				.select({
					userId: users.id,
					hash: passwords.hash,
				})
				.from(passwords)
				.innerJoin(users, eq(users.id, passwords.userId))
				.where(eq(users.email, email));

			if (!pwRecord) {
				throw invalid(issues.email("No account with this email exists"));
			}

			const authed = await argon2.verify(pwRecord.hash, _password);

			if (!authed) {
				throw invalid(issues._password("Incorrect password"));
			}

			const session = await createSession(tx, pwRecord.userId);
			return session;
		});

		getSession().set(session);

		const token = createToken(session);
		setSessionTokenCookie(token);

		throw redirect(303, "/");
	},
);

/////////////////
// logout form //
/////////////////

export const logout = form(async () => {
	const event = getRequestEvent();
	const session = event.locals.session;

	if (session) {
		await invalidateSession(db, session.sessionId);
		deleteSessionTokenCookie();
	}

	getSession().set(null);

	throw redirect(303, "/");
});

/////////////////////////
// updatePassword form //
/////////////////////////

export const updatePassword = form(
	v.object({
		_old: v.string(),
		_new: v.string(),
	}),
	async ({ _old, _new }, issues) => {
		const event = getRequestEvent();
		const session = event.locals.session;
		if (!session) {
			throw error(401);
		}

		await db.transaction(async tx => {
			const [pwRecord] = await tx
				.select()
				.from(passwords)
				.where(eq(passwords.userId, session.userId));

			const newHash = await argon2.hash(_new);

			if (!pwRecord) {
				console.warn(`User ${session.userEmail} had no password.`);
				await tx.insert(passwords).values({
					userId: session.userId,
					hash: newHash,
				});
				return;
			}

			const check = await argon2.verify(pwRecord.hash, _old);
			if (!check) {
				throw invalid(issues._old("Incorrect password"));
			}

			await tx.update(passwords).set({ hash: newHash });
		});

		throw redirect(303, `/user/${session.userId}`);
	},
);
