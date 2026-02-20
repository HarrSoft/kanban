import * as argon2 from "argon2";
import * as v from "valibot";
import { eq } from "drizzle-orm";
import { APIPushRequest } from "@harrsoft/logger";
import { error } from "@sveltejs/kit";
import db, { logs, projectKeys } from "$db";
import { KeyId } from "$types";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
	// decode auth header
	const header = request.headers.get("Authorization");
	if (!header) throw error(401);

	// check that it's using basic auth
	const [kind, creds] = header.split(" ");
	if (kind.toLowerCase() !== "basic") throw error(400);

	// decode credentials
	const decodedCreds = Buffer.from(creds || "", "base64url").toString("utf-8");
	const [keyId, apiKey] = decodedCreds.split(":");
	if (!keyId || !apiKey) throw error(400);

	// pre-emptively decode log
	let log: APIPushRequest;
	try {
		log = v.parse(APIPushRequest, await request.json());
	} catch {
		throw error(400);
	}

	// verify auth and post log
	await db.transaction(async tx => {
		const [keyRecord] = await tx
			.select({
				projectId: projectKeys.projectId,
				keyHash: projectKeys.keyHash,
			})
			.from(projectKeys)
			.where(eq(projectKeys.keyId, keyId as KeyId));

		if (!keyRecord) throw error(401);

		// verify api key
		if (!argon2.verify(keyRecord.keyHash, apiKey)) throw error(401);

		// insert log
		await tx.insert(logs).values({
			projectId: keyRecord.projectId,
			logLevel: log.level,
			service: log.service,
			message: log.message,
			file: log.file,
			function: log.function,
			line: log.line,
			column: log.column,
		});
	});

	return new Response();
};
