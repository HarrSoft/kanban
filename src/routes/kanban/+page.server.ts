import db from "$db";
import { boards, projects } from "$db/schema";
import { eq } from "drizzle-orm";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
    // Fetch all boards. Relations aren't defined yet, so we use a simple select.
    const allBoards = await db.select().from(boards);

    return { boards: allBoards };
};
