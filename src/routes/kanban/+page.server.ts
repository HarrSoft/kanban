import db from "$db";
import { boards } from "$db/schema";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	// Fetch all boards. Relations are now defined; a query with `with` would work,
	// but for the list view a simple select is sufficient — board detail handles relations.
	const allBoards = await db.select().from(boards);

	return { boards: allBoards };
};
