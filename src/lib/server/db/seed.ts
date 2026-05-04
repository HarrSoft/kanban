import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { users, projects, boards, columns, cards } from "./schema";
import * as schema from "./schema";
import { reset } from "drizzle-seed";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

const client = postgres(process.env.DATABASE_URL);
const db = drizzle({ client, schema });

async function main() {
    console.log("Seeding database...");

    // clear existing data
    // await reset(db, { users, projects, boards, columns, cards }); // drizzle-seed reset might be too aggressive or not configured, let's just insert for now or delete manually if needed. 
    // Actually, let's just delete from tables to be safe and simple.
    await db.delete(cards);
    await db.delete(columns);
    await db.delete(boards);
    await db.delete(projects);
    await db.delete(users);

    // Create User
    const [user] = await db.insert(users).values({
        handle: "demo_user" as any,
        email: "demo@example.com",
        platformRole: "admin" as any,
        theme: "ribbit-light" as any,
    }).returning();

    console.log("Created user:", user.handle);

    // Create Project
    const [project] = await db.insert(projects).values({
        handle: "demo_project" as any,
        name: "Demo Project",
    }).returning();

    console.log("Created project:", project.name);

    // Create Board
    const [board] = await db.insert(boards).values({
        projectId: project.id,
        name: "Sprint 1",
    }).returning();

    console.log("Created board:", board.name);

    // Create Columns
    const columnNames = ["To Do", "In Progress", "Done"];
    for (let i = 0; i < columnNames.length; i++) {
        const [column] = await db.insert(columns).values({
            boardId: board.id,
            name: columnNames[i],
            order: i,
        }).returning();

        // Create Cards with rich HTML content
        const cardContents = [
            `<h2><strong>${columnNames[i]} Task ${1}</strong></h2><p>This is a card with <strong>bold</strong> and <em>italic</em> text.</p><ul><li>Item 1</li><li>Item 2</li></ul>`,
            `<h3>Card ${2}</h3><p>This card demonstrates <u>underline</u> and lists:</p><ol><li>First point</li><li>Second point</li></ol>`,
            `<p>Simple card ${3} with a <a href="https://example.com" target="_blank">link</a> and some text.</p>`
        ];

        for (let j = 0; j < cardContents.length; j++) {
            await db.insert(cards).values({
                columnId: column.id,
                content: cardContents[j],
                order: j,
            });
        }
    }

    console.log("Seeding complete!");
    process.exit(0);
}

main().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
