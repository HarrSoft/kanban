/**
 * Unit tests for Theme Valibot schema.
 *
 * Validates that the Theme picklist correctly accepts defined theme values
 * and rejects invalid or malformed inputs.
 */

import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { Theme } from "./themes";

describe("Theme schema", () => {
	const validThemes = [
		"auto",
		"burning-love",
		"oceanside",
		"ribbit-dark",
		"ribbit-light",
	] as const;

	describe("accepts valid themes", () => {
		for (const theme of validThemes) {
			it(`accepts "${theme}"`, () => {
				const result = v.safeParse(Theme, theme);
				expect(result.success).toBe(true);
				if (result.success) {
					expect(result.output).toBe(theme);
				}
			});
		}
	});

	describe("rejects invalid values", () => {
		const invalidValues = [
			["dark-mode", "unregistered picklist value"],
			["light-mode", "unregistered picklist value"],
			["", "empty string"],
			["  ", "whitespace only"],
			["BURNING-LOVE", "uppercase variation"],
			["RibbitDark", "PascalCase variation"],
			["ribbit_dark", "snake_case variation"],
			[null, "null"],
			[undefined, "undefined"],
			[123, "number"],
			[{}, "object"],
		] as const;

		for (const [value, label] of invalidValues) {
			it(`rejects ${label}`, () => {
				const result = v.safeParse(Theme, value);
				expect(result.success).toBe(false);
			});
		}
	});

	describe("type-level", () => {
		it("infers as a union of string literals", () => {
			const theme: Theme = "auto";
			expect(typeof theme).toBe("string");
		});
	});
});
