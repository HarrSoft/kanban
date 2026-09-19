import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	slugify,
	parseStatus,
	stripStatus,
	clip,
	boardColumnForStatus,
	parseQuestsContent,
	parseQuestsFile,
	questsToKanbanPayloads,
} from "./parse-quests";

const SAMPLE = `---
created: 2026-01-01
updated: 2026-08-31
---

# Cognitive enhancements

## Reading list
+ Quests about reading.

### ✅ Finish TNG
Description line one.
+ plus-prefixed description

### 🔄 Deep dive
A running quest.

## Memory work

### 📅 Spaced repetition

#### Nested bit
sub description
`;

describe("parse-quests helpers", () => {
	it("slugify lowercases and dashes", () => {
		expect(slugify("Hello, World! 2026")).toBe("hello-world-2026");
	});

	it("parseStatus maps the three markers", () => {
		expect(parseStatus("✅ done")).toBe("done");
		expect(parseStatus("🔄 wip")).toBe("in-progress");
		expect(parseStatus("📅 planned")).toBe("planned");
		expect(parseStatus("plain")).toBe("info");
	});

	it("stripStatus removes a leading marker only", () => {
		expect(stripStatus("✅ Finish TNG")).toBe("Finish TNG");
		expect(stripStatus("Finish ✅ TNG")).toBe("Finish ✅ TNG");
	});

	it("boardColumnForStatus covers every status", () => {
		expect(boardColumnForStatus("done")).toBe("Done");
		expect(boardColumnForStatus("in-progress")).toBe("In Progress");
		expect(boardColumnForStatus("planned")).toBe("To Do");
		expect(boardColumnForStatus("info")).toBe("Info");
	});
});

describe("clip — surrogate-safe truncation", () => {
	it("returns the string unchanged when short enough", () => {
		expect(clip("abcdef", 10)).toBe("abcdef");
	});

	it("truncates normally mid-ASCII", () => {
		expect(clip("abcdef", 3)).toBe("abc");
	});

	it("never orphans a surrogate pair at the boundary", () => {
		// 79 'x' + a 2-unit astral emoji (U+1F504) = 81 units; a blind slice(0,80)
		// would keep the high surrogate alone.
		const s = "x".repeat(79) + "🔄";
		const out = clip(s, 80);
		expect(out.length).toBe(79);
		// No lone surrogate anywhere in the output.
		for (let i = 0; i < out.length; i++) {
			const c = out.charCodeAt(i);
			if (c >= 0xd800 && c <= 0xdbff) {
				const n = out.charCodeAt(i + 1);
				expect(n >= 0xdc00 && n <= 0xdfff).toBe(true);
			}
		}
	});
});

describe("parseQuestsContent", () => {
	it("parses frontmatter, domains, boards and cards", () => {
		const data = parseQuestsContent(SAMPLE);
		expect(data.meta.created).toBe("2026-01-01");
		expect(data.meta.updated).toBe("2026-08-31");
		expect(data.domains).toHaveLength(1);
		const domain = data.domains[0];
		expect(domain.title).toBe("Cognitive enhancements");
		expect(domain.boards.length).toBe(2);

		const board = domain.boards[0];
		expect(board.title).toBe("Reading list");
		expect(board.status).toBe("active");
		expect(board.cards.map((c) => c.title)).toEqual(["Finish TNG", "Deep dive"]);
		expect(board.cards[0].status).toBe("done");
		expect(board.cards[1].status).toBe("in-progress");
		// "+" lines become description; bare lines too.
		expect(board.cards[0].description).toContain("Description line one.");
		expect(board.cards[0].description).toContain("plus-prefixed description");
	});

	it("marks a done board inactive", () => {
		const data = parseQuestsContent("# D\n## ✅ Finished board\n### ✅ card\n");
		expect(data.domains[0].boards[0].status).toBe("inactive");
	});

	it("nests level-4 cards under the most recent level-3 card", () => {
		const data = parseQuestsContent(SAMPLE);
		const board = data.domains[0].boards[1]; // Memory work
		expect(board.cards).toHaveLength(1);
		expect(board.cards[0].title).toBe("Spaced repetition");
		expect(board.cards[0].children.map((c) => c.title)).toEqual(["Nested bit"]);
	});
});

describe("questsToKanbanPayloads", () => {
	it("produces one board per board, with column placement", () => {
		const data = parseQuestsContent(SAMPLE);
		const payloads = questsToKanbanPayloads(data);
		expect(payloads.map((p) => p.name)).toEqual(["Quests: Reading list", "Quests: Memory work"]);
		const reading = payloads[0];
		expect(reading.cards[0].column).toBe("Done");
		expect(reading.cards[1].column).toBe("In Progress");
	});

	it("renders sub-items and clips them surrogate-safely", () => {
		const long = "⚠️ " + "y".repeat(200);
		const data = parseQuestsContent(`# D\n## B\n### P\n#### c\n${long}\n`);
		const payloads = questsToKanbanPayloads(data);
		const desc = payloads[0].cards[0].description;
		expect(desc).toContain("**Sub-items:**");
		expect(desc).toContain("- c:");
		// No lone surrogate in the rendered description.
		for (let i = 0; i < desc.length; i++) {
			const c = desc.charCodeAt(i);
			if (c >= 0xd800 && c <= 0xdbff) {
				const n = desc.charCodeAt(i + 1);
				expect(n >= 0xdc00 && n <= 0xdfff).toBe(true);
			}
		}
	});
});

describe("parseQuestsFile", () => {
	it("reads and parses from disk", () => {
		const dir = mkdtempSync(join(tmpdir(), "quests-"));
		const p = join(dir, "Quests.md");
		writeFileSync(p, "# Domain\n## Board\n### Card\n");
		const data = parseQuestsFile(p);
		expect(data.domains[0].boards[0].cards[0].title).toBe("Card");
	});
});
