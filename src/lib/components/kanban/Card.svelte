<script lang="ts">
	import { onMount } from "svelte";
	import "quill/dist/quill.snow.css";
	import type QuillType from "quill";

	export let card: { id: string; content: string };
	export let onDelete: (id: string) => void;

	let editorContainer: HTMLDivElement;
	let quill: QuillType | null = null;

	onMount(async () => {
		if (editorContainer) {
			const QuillModule: any = await import("quill");
			quill = new QuillModule.default(editorContainer, {
				theme: "bubble",
				readOnly: true,
				modules: { toolbar: false },
			});

			// Try to parse as JSON (Delta), otherwise treat as text/html
			try {
				const delta = JSON.parse(card.content);
				quill.setContents(delta);
			} catch {
				quill.setText(card.content);
			}
		}
	});
</script>

<div
	class="group relative mb-2 rounded border border-gray-200 bg-white p-3 shadow-sm"
>
	<div bind:this={editorContainer} class="quill-read-only"></div>

	<button
		class="absolute top-1 right-1 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
		on:click={() => onDelete(card.id)}
		aria-label="Delete card"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-4 w-4"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M6 18L18 6M6 6l12 12"
			/>
		</svg>
	</button>
</div>

<style>
	/* Minimal override for read-only view to look like normal text */
	:global(.quill-read-only .ql-container) {
		font-family: inherit;
		font-size: inherit;
	}
	:global(.quill-read-only .ql-editor) {
		padding: 0;
		min-height: auto;
	}
</style>
