#!/usr/bin/env bun
/**
 * sync-quests.ts — Quests.md ↔ Kanban Sync Tool (MVP)
 *
 * Parses harrsoft-shared/Quests.md (Lavra's quest list) into structured
 * kanban-compatible JSON. Designed for future bidirectional sync.
 *
 * Usage:
 *   bun run scripts/sync-quests.ts                      # parse & print JSON
 *   bun run scripts/sync-quests.ts --apply               # create via kanban API
 *   bun run scripts/sync-quests.ts --apply --dry-run     # show what would be created
 *
 * Parsing convention:
 *   #         = Top-level domain (e.g. "Cognitive enhancements")
 *   ##        = Quest group / board name
 *   ###-###### = Cards / sub-cards (recursive nesting)
 *
 * Special patterns:
 *   - ✅ / 🔄 / 📅  = status markers on headings
 *   - Lines starting with "+" after heading = description
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const WORKSPACE_ROOT = resolve(REPO_ROOT, "..");
const DEFAULT_QUESTS_PATH = resolve(WORKSPACE_ROOT, "harrsoft-shared", "Quests.md");

// ─── Types ──────────────────────────────────────────────────────────────────

interface QuestCard {
	id: string;
	title: string;
	description: string;
	status: "done" | "in-progress" | "planned" | "info";
	level: number; // heading depth (3+)
	children: QuestCard[];
}

interface QuestBoard {
	id: string;
	title: string;
	description: string;
	status: "active" | "inactive";
	cards: QuestCard[];
}

interface QuestDomain {
	id: string;
	title: string;
	boards: QuestBoard[];
}

interface QuestData {
	meta: { created: string; updated: string };
	domains: QuestDomain[];
}

// ─── Parsing ────────────────────────────────────────────────────────────────

function parseStatus(title: string): QuestCard["status"] {
	if (title.includes("✅")) return "done";
	if (title.includes("🔄")) return "in-progress";
	if (title.includes("📅")) return "planned";
	return "info";
}

function stripStatus(title: string): string {
	return title.replace(/^[✅🔄📅]\s*/, "").trim();
}

function parseDescription(lines: string[], startIdx: number): { description: string; endIdx: number } {
	const descLines: string[] = [];
	let i = startIdx;
	while (i < lines.length) {
		const line = lines[i].trim();
		if (line === "" || line.startsWith("#")) break;
		if (line.startsWith("+")) {
			descLines.push(line.slice(1).trim());
		} else if (!line.startsWith("-") && !line.startsWith("|")) {
			descLines.push(line);
		}
		i++;
	}
	return { description: descLines.join("\n"), endIdx: i };
}

function parseQuests(filePath: string): QuestData {
	const content = readFileSync(filePath, "utf-8");
	const lines = content.split("\n");

	// Parse frontmatter (only at start of file)
	let meta: QuestData["meta"] = { created: "", updated: "" };
	if (lines[0]?.trim() === "---") {
		const fmEnd = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
		if (fmEnd > 0) {
			const fmLines = lines.slice(1, fmEnd);
			for (const l of fmLines) {
				const [k, ...rest] = l.split(":");
				const v = rest.join(":").trim();
				if (k.trim() === "created") meta.created = v;
				if (k.trim() === "updated") meta.updated = v;
			}
			lines.splice(0, fmEnd + 1); // remove frontmatter
		}
	}

	// Remove any remaining horizontal rule markers (---, ***) that could be mistaken for headings
	const cleanedLines = lines.filter((l) => !/^---$/.test(l.trim()) && !/^\*\*\*$/.test(l.trim()));

	const domains: QuestDomain[] = [];
	let currentDomain: QuestDomain | null = null;
	let currentBoard: QuestBoard | null = null;

	for (let i = 0; i < cleanedLines.length; i++) {
		const line = cleanedLines[i];
		const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
		if (!headingMatch) continue;

		const [_, hashes, rawTitle] = headingMatch;
		const level = hashes.length;
		const title = rawTitle.trim();
		const status = level >= 3 ? parseStatus(title) : "info";
		const cleanTitle = level >= 3 ? stripStatus(title) : title;

		const { description, endIdx } = parseDescription(cleanedLines, i + 1);
		i = endIdx - 1; // skip description lines

		if (level === 1) {
			// Top-level domain
			if (currentDomain) domains.push(currentDomain);
			currentDomain = {
				id: slugify(cleanTitle),
				title: cleanTitle,
				boards: [],
			};
			currentBoard = null;
		} else if (level === 2) {
			// Board / quest group
			if (currentBoard && currentDomain) {
				currentDomain.boards.push(currentBoard);
			}
			currentBoard = {
				id: slugify(cleanTitle),
				title: cleanTitle,
				description,
				status: status === "done" ? "inactive" : "active",
				cards: [],
			};
		} else if (level >= 3 && currentBoard) {
			// Card or sub-card
			const card: QuestCard = {
				id: slugify(cleanTitle),
				title: cleanTitle,
				description,
				status,
				level,
				children: [],
			};
			// Simple nesting: put level 4+ cards under most recent level 3
			if (level === 3) {
				currentBoard.cards.push(card);
			} else if (currentBoard.cards.length > 0) {
				const parent = currentBoard.cards[currentBoard.cards.length - 1];
				parent.children.push(card);
			} else {
				currentBoard.cards.push(card);
			}
		}
	}

	// Flush remaining
	if (currentBoard && currentDomain) currentDomain.boards.push(currentBoard);
	if (currentDomain) domains.push(currentDomain);

	return { meta, domains };
}

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 64);
}

// ─── Kanban API integration ────────────────────────────────────────────────

interface KanbanPayload {
	name: string;
	description: string;
	columns: string[];
	cards: { title: string; description: string; column: string }[];
}

function questsToKanbanPayloads(data: QuestData): KanbanPayload[] {
	const payloads: KanbanPayload[] = [];

	for (const domain of data.domains) {
		for (const board of domain.boards) {
			const cards = board.cards.map((c) => ({
				title: c.title,
				description: c.description + (c.children.length > 0
					? "\n\n**Sub-items:**\n" + c.children.map((ch) => `- ${ch.title}: ${ch.description.slice(0, 80)}`).join("\n")
					: ""),
				column: boardColumnForStatus(c.status),
			}));

			payloads.push({
				name: `Quests: ${board.title}`,
				description: `From Quests.md (${domain.title}) — ${board.description || board.title}`,
				columns: ["To Do", "In Progress", "Done", "Info"],
				cards,
			});
		}
	}

	return payloads;
}

function boardColumnForStatus(status: QuestCard["status"]): string {
	switch (status) {
		case "done": return "Done";
		case "in-progress": return "In Progress";
		case "planned": return "To Do";
		case "info": return "Info";
	}
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
	const args = process.argv.slice(2);
	const apply = args.includes("--apply");
	const dryRun = args.includes("--dry-run");

	const questsPath = existsSync(DEFAULT_QUESTS_PATH)
		? DEFAULT_QUESTS_PATH
		: resolve(REPO_ROOT, "..", "harrsoft-shared", "Quests.md");

	if (!existsSync(questsPath)) {
		console.error("✗ Quests.md not found at:", questsPath);
		process.exit(1);
	}

	console.error("📖 Parsing:", questsPath);
	const data = parseQuests(questsPath);
	console.error(`  → ${data.domains.length} domains, ${data.domains.reduce((s, d) => s + d.boards.length, 0)} boards`);

	if (!apply) {
		// Print parsed JSON
		console.log(JSON.stringify(data, null, 2));
		console.error("\nTip: Use --apply to create boards in kanban, or --dry-run to preview API calls.");
		return;
	}

	const payloads = questsToKanbanPayloads(data);

	for (const p of payloads) {
		if (dryRun) {
			console.log(`[DRY RUN] Would create board "${p.name}" with ${p.cards.length} cards`);
			continue;
		}
		console.error(`Creating board: ${p.name}...`);
		try {
			const res = await fetch("http://localhost:5173/api/kanban/boards", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: p.name,
					description: p.description,
					cardTitles: p.cards.map((c) => c.title),
				}),
			});
			if (!res.ok) {
				const text = await res.text();
				console.error(`  ✗ ${res.status}: ${text}`);
			} else {
				const result = await res.json();
				console.error(`  ✓ Created: ${result.id || "unknown"}`);
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			console.error(`  ✗ Failed: ${msg}`);
		}
	}
}

main().catch((err: unknown) => {
	const msg = err instanceof Error ? err.message : String(err);
	console.error("Fatal:", msg);
	process.exit(1);
});
