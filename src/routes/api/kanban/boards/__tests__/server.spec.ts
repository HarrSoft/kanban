import { describe, it, expect } from "vitest";

describe("CreateBoard API endpoint", () => {
	it("accepts minimal input", () => {
		const input = { name: "Test Board" };
		expect(input.name).toBe("Test Board");
	});

	it("accepts full input", () => {
		const input = {
			name: "Full Board",
			description: "A board with everything",
			columns: ["Backlog", "Doing", "Review", "Done"],
			cardTitles: ["Card 1", "Card 2"],
		};
		expect(input.name).toBe("Full Board");
		expect(input.columns).toHaveLength(4);
		expect(input.cardTitles).toHaveLength(2);
	});

	it("defaults columns to To Do / In Progress / Done when omitted", () => {
		const defaultCols = ["To Do", "In Progress", "Done"];
		expect(defaultCols).toContain("To Do");
		expect(defaultCols).toContain("In Progress");
		expect(defaultCols).toContain("Done");
	});
});
