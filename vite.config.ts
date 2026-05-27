import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import { sveltekit } from "@sveltejs/kit/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			"$": path.resolve(__dirname, "./src"),
			"$com": path.resolve(__dirname, "./src/lib/components"),
			"$db": path.resolve(__dirname, "./src/lib/server/db"),
			"$server": path.resolve(__dirname, "./src/lib/server"),
			"$api": path.resolve(__dirname, "./src/routes/api"),
			"$types": path.resolve(__dirname, "./src/lib/types"),
		},
	},
	plugins: [tailwindcss(), sveltekit()],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: "./vite.config.ts",
				test: {
					name: "client",
					environment: "browser",
					browser: {
						enabled: true,
						provider: "playwright",
						instances: [{ browser: "chromium" }],
					},
					include: ["src/**/*.svelte.{test,spec}.{js,ts}"],
					exclude: ["src/lib/server/**", "e2e/**"],
					setupFiles: ["./vitest-setup-client.ts"],
				},
			},
			{
				extends: "./vite.config.ts",
				test: {
					name: "server",
					environment: "node",
					include: ["src/**/*.{test,spec}.{js,ts}"],
					exclude: ["src/**/*.svelte.{test,spec}.{js,ts}", "e2e/**"],
					setupFiles: ["./vitest-setup-server.ts"],
				},
			},
		],
	},
});
