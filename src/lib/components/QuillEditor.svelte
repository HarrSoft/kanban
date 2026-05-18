<script lang="ts">
	import { onMount } from "svelte";
	import { browser } from "$app/environment";
	import type QuillType from "quill";

	let editorContainer: HTMLDivElement;
	let quill: QuillType | null = null;
	let QuillClass: typeof QuillType | null = null;

	export let placeholder = "Enter text...";
	export let initialContent = "";

	// Expose methods to parent
	export function getHTML(): string {
		if (!quill) return "";
		return quill.root.innerHTML;
	}

	export function setHTML(html: string) {
		if (!quill) return;
		quill.root.innerHTML = html;
	}

	export function clear() {
		if (!quill) return;
		quill.setText("");
	}

	// Destroy Quill on unmount
	import { onDestroy } from "svelte";

	onDestroy(() => {
		quill = null;
	});

	onMount(async () => {
		if (!browser) return;

		// Dynamically import Quill only on the client
		const QuillModule: any = await import("quill");
		QuillClass = QuillModule.default;

		// Also import the CSS
		await import("quill/dist/quill.snow.css");

		quill = new QuillClass(editorContainer, {
			theme: "snow",
			placeholder,
			modules: {
				toolbar: [
					[{ header: [1, 2, 3, false] }],
					["bold", "italic", "underline", "strike"],
					[{ list: "ordered" }, { list: "bullet" }],
					["link"],
					["clean"],
				],
			},
		});

		if (initialContent) {
			quill.root.innerHTML = initialContent;
		}
	});
</script>

<div bind:this={editorContainer} class="quill-editor"></div>

<style>
	:global(.quill-editor) {
		background: white;
	}

	:global(.ql-toolbar) {
		border-top-left-radius: 0.375rem;
		border-top-right-radius: 0.375rem;
	}

	:global(.ql-container) {
		border-bottom-left-radius: 0.375rem;
		border-bottom-right-radius: 0.375rem;
		min-height: 150px;
	}
</style>
