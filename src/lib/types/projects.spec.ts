/**
 * Unit tests for Project-related Valibot schemas.
 */

import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { ProjectInfo, ProjectFull, ProjectMemberRole } from "./projects";

describe("ProjectMemberRole", () => {
	const validRoles = ["admin", "contributor", "viewer"] as const;

	for (const role of validRoles) {
		it(`accepts "${role}"`, () => {
			expect(v.parse(ProjectMemberRole, role)).toBe(role);
		});
	}

	const invalidRoles = [
		["owner", "unregistered"],
		["", "empty string"],
		["Admin", "capitalised"],
		[null, "null"],
		[123, "number"],
	] as const;

	for (const [value, label] of invalidRoles) {
		it(`rejects ${label}`, () => {
			const result = v.safeParse(ProjectMemberRole, value);
			expect(result.success).toBe(false);
		});
	}
});

describe("ProjectInfo", () => {
	const validCuid = "clxabcdef1234567890abcdef";
	const validProject = {
		id: validCuid,
		name: "My Project",
		imageUrl: null,
	};

	it("accepts a valid project with null image", () => {
		const result = v.safeParse(ProjectInfo, validProject);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.output.name).toBe("My Project");
		}
	});

	it("accepts a project with a URL image", () => {
		const project = {
			...validProject,
			imageUrl: "https://example.com/logo.png",
		};
		const result = v.safeParse(ProjectInfo, project);
		expect(result.success).toBe(true);
	});

	it("rejects an invalid image URL", () => {
		const project = { ...validProject, imageUrl: "not-a-url" };
		const result = v.safeParse(ProjectInfo, project);
		expect(result.success).toBe(false);
	});

	it("rejects missing name", () => {
		const result = v.safeParse(ProjectInfo, { id: validCuid });
		expect(result.success).toBe(false);
	});

	it("rejects missing id", () => {
		const result = v.safeParse(ProjectInfo, { name: "No ID", imageUrl: null });
		expect(result.success).toBe(false);
	});

	it("allows empty name (schema currently lacks min-length)", () => {
		// Schema uses v.string() without min-length — empty passes
		const result = v.safeParse(ProjectInfo, {
			id: validCuid,
			name: "",
			imageUrl: null,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.output.name).toBe("");
		}
	});
});

describe("ProjectFull", () => {
	const validCuid = "clxabcdef1234567890abcdef";
	const validUser = {
		id: validCuid,
		name: "Alice",
		email: "alice@example.com",
		platformRole: "user",
		imageUrl: null,
	};

	it("accepts a full project with all member arrays", () => {
		const project = {
			id: validCuid,
			name: "Big Project",
			imageUrl: null,
			admins: [validUser],
			contributors: [],
			viewers: [],
		};
		const result = v.safeParse(ProjectFull, project);
		expect(result.success).toBe(true);
	});

	it("rejects project without admins field", () => {
		const result = v.safeParse(ProjectFull, {
			id: validCuid,
			name: "Incomplete",
			imageUrl: null,
			contributors: [],
			viewers: [],
		});
		expect(result.success).toBe(false);
	});
});
