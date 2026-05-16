/**
 * Unit tests for the /api/boards route — request validation.
 *
 * Tests validate that the POST and GET handlers correctly
 * reject malformed input before any DB interaction occurs.
 * Full integration tests (actual DB operations) belong in e2e/.
 */

import { describe, it, expect } from "vitest";
import { POST, GET } from "../boards/+server";

// ---------------------------------------------------------------------------
// POST /api/boards
// ---------------------------------------------------------------------------

describe("POST /api/boards", () => {
	it("rejects request with missing projectId and name", async () => {
		const request = new Request("http://localhost:5173/api/boards", {
			method: "POST",
			body: JSON.stringify({}),
		});

		const response = await POST({ request } as Parameters<typeof POST>[0]);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body).toEqual({ error: "Missing projectId or name" });
	});

	it("rejects request with missing projectId", async () => {
		const request = new Request("http://localhost:5173/api/boards", {
			method: "POST",
			body: JSON.stringify({ name: "My Board" }),
		});

		const response = await POST({ request } as Parameters<typeof POST>[0]);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body).toEqual({ error: "Missing projectId or name" });
	});

	it("rejects request with missing name", async () => {
		const request = new Request("http://localhost:5173/api/boards", {
			method: "POST",
			body: JSON.stringify({ projectId: "clxabcdef1234567890abcdef" }),
		});

		const response = await POST({ request } as Parameters<typeof POST>[0]);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body).toEqual({ error: "Missing projectId or name" });
	});

	it("rejects invalid projectId format (bad chars)", async () => {
		const request = new Request("http://localhost:5173/api/boards", {
			method: "POST",
			body: JSON.stringify({
				projectId: "!!!!invalid!!!!",
				name: "My Board",
			}),
		});

		const response = await POST({ request } as Parameters<typeof POST>[0]);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body).toEqual({ error: "Invalid projectId format" });
	});

	it("rejects empty projectId — caught by truthiness check", async () => {
		const request = new Request("http://localhost:5173/api/boards", {
			method: "POST",
			body: JSON.stringify({
				projectId: "",
				name: "My Board",
			}),
		});

		const response = await POST({ request } as Parameters<typeof POST>[0]);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body).toEqual({ error: "Missing projectId or name" });
	});

	it("rejects null projectId — caught by truthiness check", async () => {
		const request = new Request("http://localhost:5173/api/boards", {
			method: "POST",
			body: JSON.stringify({
				projectId: null,
				name: "My Board",
			}),
		});

		const response = await POST({ request } as Parameters<typeof POST>[0]);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body).toEqual({ error: "Missing projectId or name" });
	});
});

// ---------------------------------------------------------------------------
// GET /api/boards?projectId=...
// ---------------------------------------------------------------------------

describe("GET /api/boards", () => {
	it("rejects missing projectId query param", async () => {
		const request = new Request("http://localhost:5173/api/boards", {
			method: "GET",
		});

		const response = await GET({
			request,
			url: new URL("http://localhost:5173/api/boards"),
		} as Parameters<typeof GET>[0]);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body).toEqual({ error: "Missing projectId" });
	});

	it("rejects empty projectId query param — caught by truthiness check", async () => {
		const url = new URL("http://localhost:5173/api/boards?projectId=");
		const request = new Request(url, { method: "GET" });

		const response = await GET({ request, url } as Parameters<typeof GET>[0]);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body).toEqual({ error: "Missing projectId" });
	});

	it("rejects invalid projectId format in query", async () => {
		const url = new URL("http://localhost:5173/api/boards?projectId=!!!bad!!!");
		const request = new Request(url, { method: "GET" });

		const response = await GET({ request, url } as Parameters<typeof GET>[0]);
		const body = await response.json();

		expect(response.status).toBe(400);
		expect(body).toEqual({ error: "Invalid projectId format" });
	});
});
