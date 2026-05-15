/**
 * Server-side vitest setup: mocks SvelteKit environment modules
 * that are normally resolved by Vite during dev/build.
 */

import { vi } from "vitest";

// Mock $env/dynamic/private
vi.mock("$env/dynamic/private", () => {
	return {
		env: {
			AUTH_SECRET:
				"0000000000000000000000000000000000000000000000000000000000000000",
			DATABASE_URL: "postgres://localhost:5432/kanban_test",
		},
	};
});

// Mock $app/environment
vi.mock("$app/environment", () => {
	return {
		building: false,
		dev: true,
		version: "test",
	};
});
