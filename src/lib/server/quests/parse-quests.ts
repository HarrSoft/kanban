/**
 * parse-quests.ts — Quests.md → kanban payload parsing (pure, testable).
 *
 * Extracted from scripts/sync-quests.ts (2026-09-19) so the logic can live
 * under the server vitest project (the repo's test convention) while the
 * script stays a thin CLI wrapper.
 *
 * Parsing convention:
 *   #          = Top-level domain (e.g. "Cognitive enhancements")
 *   ##         = Quest group / board name
 *   ###-###### = Cards / sub-cards (recursive nesting)
 *
 * Special patterns:
 *   - ✅ / 🔄 / 📅  = status markers on headings
 *   - Lines starting with "+" after a heading = description
 */

import { readFileSync } from "node:fs";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface QuestCard {
	id: string;
	title: string;
	description: string;
	status: "done" | "in-progress" | "planned" | "info";
	level: number; // heading depth (3+)
	children: QuestCard[];
}

export interface QuestBoard {
	id: string;
	title: string;
	description: string;
	status: "active" | "inactive";
	cards: QuestCard[];
}

export interface QuestDomain {
	id: string;
	title: string;
	boards: QuestBoard[];
}

export interface QuestData {
	meta: { created: string; updated: string };
	domains: QuestDomain[];
}

export interface KanbanPayload {
	name: string;
	description: string;
	columns: string[];
	cards: { title: string; description: string; column: string }[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 64);
}

export function parseStatus(title: string): QuestCard["status"] {
	if (title.includes("✅")) return "done";
	if (title.includes("🔄")) return "in-progress";
	if (title.includes("📅")) return "planned";
	return "info";
}

export function stripStatus(title: string): string {
	// The `u` flag is load-bearing: without it, `[✅🔄📅]` is a set of UTF-16 code
	// units, and the astral markers (🔄 U+1F504, 📅 U+1F4C5) match only their high
	// surrogate half — leaving a lone low surrogate in the stripped title.
	return title.replace(/^[✅🔄📅]\s*/u, "").trim();
}

export function boardColumnForStatus(status: QuestCard["status"]): string {
	switch (status) {
		case "done": return "Done";
		case "in-progress": return "In Progress";
		case "planned": return "To Do";
		case "info": return "Info";
	}
}

/**
 * clip — surrogate-safe truncation.
 *
 * `String.prototype.slice` counts UTF-16 code units, so a blind slice can
 * split a surrogate pair (e.g. 🔄 = U+1F504) and leave a lone surrogate —
 * invalid UTF-8 that mangles on write. Never cut between a high and low
 * surrogate; back off one unit instead.
 *
 * (Found 2026-09-19: the importer's sub-item summary used a blind
 * `.slice(0, 80)` on card descriptions that routinely begin with ⚠️/🔄/📅.)
 */
export function clip(text: string, max = 80): string {
	if (text.length <= max) return text;
	let end = max;
	const code = text.charCodeAt(end - 1);
	// High surrogate at the cut boundary → drop it so we don't orphan a pair.
	if (code >= 0xd800 && code <= 0xdbff) end -= 1;
	return text.slice(0, end);
}

// ─── Parsing ────────────────────────────────────────────────────────────────

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

export function parseQuestsContent(content: string): QuestData {
	const lines = content.split("\n");

	// Parse frontmatter (only at start of file)
	const meta: QuestData["meta"] = { created: "", updated: "" };
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
		// Status markers apply to boards (level 2) and cards (level 3+). The board
		// branch below reads `status === "done"`, so it must be computed for level 2
		// too — otherwise a "✅ board" can never be marked inactive.
		const status = level >= 2 ? parseStatus(title) : "info";
		const cleanTitle = level >= 2 ? stripStatus(title) : title;

		const { description, endIdx } = parseDescription(cleanedLines, i + 1);
		i = endIdx - 1; // skip description lines

		if (level === 1) {
			if (currentDomain) domains.push(currentDomain);
			currentDomain = { id: slugify(cleanTitle), title: cleanTitle, boards: [] };
			currentBoard = null;
		} else if (level === 2) {
			if (currentBoard && currentDomain) currentDomain.boards.push(currentBoard);
			currentBoard = {
				id: slugify(cleanTitle),
				title: cleanTitle,
				description,
				status: status === "done" ? "inactive" : "active",
				cards: [],
			};
		} else if (level >= 3 && currentBoard) {
			const card: QuestCard = {
				id: slugify(cleanTitle),
				title: cleanTitle,
				description,
				status,
				level,
				children: [],
			};
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

	if (currentBoard && currentDomain) currentDomain.boards.push(currentBoard);
	if (currentDomain) domains.push(currentDomain);

	return { meta, domains };
}

export function parseQuestsFile(filePath: string): QuestData {
	return parseQuestsContent(readFileSync(filePath, "utf-8"));
}

// ─── Kanban payloads ────────────────────────────────────────────────────────

export function questsToKanbanPayloads(data: QuestData): KanbanPayload[] {
	const payloads: KanbanPayload[] = [];

	for (const domain of data.domains) {
		for (const board of domain.boards) {
			const cards = board.cards.map((c) => ({
				title: c.title,
				description:
					c.description +
					(c.children.length > 0
						? "\n\n**Sub-items:**\n" +
							c.children.map((ch) => `- ${ch.title}: ${clip(ch.description)}`).join("\n")
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
