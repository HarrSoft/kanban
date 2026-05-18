<script lang="ts">
	import type { PageData } from "./$types";
	import { enhance } from "$app/forms";
	// import { resolve } from "$app/paths";  // not needed
	import { dndzone } from "svelte-dnd-action";
	import QuillEditor from "$lib/components/QuillEditor.svelte";
	import type { CardId, ColumnId } from "$types/ids";

	export let data: PageData;

	let showNewColumnForm = false;
	let showNewCardForm: Record<string, boolean> = {};
	let quillEditors: Record<string, QuillEditor> = {};

	// Locking state for drag-handling — prevents reorder during animation
	// Locking state reserved for future drag-handling improvements
	let lockedColumns = false; // eslint-disable-line @typescript-eslint/no-unused-vars

	function lockColumns() {
		lockedColumns = true;
	}

	function unlockColumns() {
		lockedColumns = false;
	}

	// Make columns and cards reactive for drag and drop
	function transformColumns() {
		return (
			data.board.columns?.map(col => ({
				...col,
				items: col.cards || [],
			})) || []
		);
	}

	let columns = transformColumns();

	$: if (data) {
		columns = transformColumns();
	}

	const flipDurationMs = 200;

	function handleColumnDndConsider(e: CustomEvent, columnId: ColumnId) {
		lockColumns();
		columns = columns.map(col =>
			col.id === columnId ? { ...col, items: e.detail.items } : col,
		);
	}

	async function handleColumnDndFinalize(e: CustomEvent, columnId: ColumnId) {
		columns = columns.map(col =>
			col.id === columnId ? { ...col, items: e.detail.items } : col,
		);
		unlockColumns();

		// Update card order on server
		const formData = new FormData();
		formData.append("items", JSON.stringify(e.detail.items));
		formData.append("columnId", columnId);

		await fetch("?/updateCardOrder", {
			method: "POST",
			body: formData,
		});
	}

	// Editing state
	let editingCardId: CardId | null = null;
	let editingCardContent: string = "";

	function startEdit(cardId: CardId, content: string) {
		editingCardId = cardId;
		editingCardContent = content;
	}

	function cancelEdit() {
		editingCardId = null;
		editingCardContent = "";
	}

	async function saveEdit(cardId: CardId) {
		const trimmed = editingCardContent.trim();
		if (!trimmed) {
			alert("Card content cannot be empty.");
			return;
		}

		const formData = new FormData();
		formData.append("cardId", cardId);
		formData.append("content", editingCardContent);

		const response = await fetch("?/updateCard", {
			method: "POST",
			body: formData,
		});

		if (response.ok) {
			editingCardId = null;
			window.location.reload();
		} else {
			alert("Failed to update card. Please try again.");
		}
	}

	function toggleNewCardForm(columnId: string) {
		showNewCardForm = {
			...showNewCardForm,
			[columnId]: !showNewCardForm[columnId],
		};
	}

	async function handleCardSubmit(columnId: string) {
		const editor = quillEditors[columnId];
		if (!editor) return;

		const content = editor.getHTML();
		const trimmedContent = content.replace(/<p><br><\/p>/g, "").trim();

		// Check if content is empty or just whitespace
		if (!trimmedContent || trimmedContent === "<p></p>") {
			alert("Please enter some content for the card.");
			return;
		}

		const formData = new FormData();
		formData.append("content", content);
		formData.append("columnId", columnId);

		const response = await fetch("?/createCard", {
			method: "POST",
			body: formData,
		});

		if (response.ok) {
			editor.clear();
			showNewCardForm[columnId] = false;
			window.location.reload();
		} else {
			alert("Failed to create card. Please try again.");
		}
	}

	async function deleteCard(cardId: CardId) {
		if (!confirm("Delete this card?")) return;

		const formData = new FormData();
		formData.append("cardId", cardId);

		const response = await fetch("?/deleteCard", {
			method: "POST",
			body: formData,
		});

		if (response.ok) {
			window.location.reload();
		}
	}

	async function deleteColumn(columnId: ColumnId) {
		if (!confirm("Delete this column and all its cards?")) return;

		const formData = new FormData();
		formData.append("columnId", columnId);

		const response = await fetch("?/deleteColumn", {
			method: "POST",
			body: formData,
		});

		if (response.ok) {
			window.location.reload();
		}
	}
</script>

<svelte:head>
	<title>{data.board.name} - Kanban Board</title>
</svelte:head>

<div class="max-w-full p-8">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="mb-2 text-2xl font-bold">{data.board.name}</h1>
			<a href="/kanban" class="text-blue-600 hover:underline"
				>← Back to Boards</a
			>
		</div>
		<button
			onclick={() => (showNewColumnForm = !showNewColumnForm)}
			class="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
		>
			+ New Column
		</button>
	</div>

	{#if showNewColumnForm}
		<form
			method="POST"
			action="?/createColumn"
			use:enhance
			class="mb-6 max-w-md rounded-lg border border-gray-200 bg-white p-4"
		>
			<h3 class="mb-3 font-semibold">Create New Column</h3>
			<input
				type="text"
				name="name"
				placeholder="Column name"
				required
				class="mb-3 w-full rounded-md border border-gray-300 px-3 py-2"
			/>
			<div class="flex gap-2">
				<button
					type="submit"
					class="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
				>
					Create
				</button>
				<button
					type="button"
					onclick={() => (showNewColumnForm = false)}
					class="rounded-md bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
				>
					Cancel
				</button>
			</div>
		</form>
	{/if}

	<div class="flex gap-4 overflow-x-auto pb-4">
		{#if columns.length > 0}
			{#each columns as column (column.id)}
				<div class="w-80 flex-shrink-0 rounded-lg bg-gray-100 p-4">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="text-lg font-semibold">{column.name}</h2>
						<button
							onclick={() => deleteColumn(column.id)}
							class="text-sm text-red-500 hover:text-red-700"
							title="Delete column"
						>
							✕
						</button>
					</div>

					<div
						use:dndzone={{ items: column.items, flipDurationMs, type: "card" }}
						onconsider={e => handleColumnDndConsider(e, column.id)}
						onfinalize={e => handleColumnDndFinalize(e, column.id)}
						class="mb-3 min-h-[100px] space-y-2 rounded-md transition-colors {(
							column.items.length === 0
						) ?
							'border-2 border-dashed border-gray-300 bg-gray-50'
						:	''}"
					>
						{#if column.items.length === 0}
							<div
								class="flex h-24 items-center justify-center text-sm text-gray-400"
							>
								Drop cards here or click "+ Add Card" below
							</div>
						{/if}
						{#each column.items as card (card.id)}
							<div
								class="group relative cursor-move rounded-md border border-gray-200 bg-white p-3 shadow-sm"
								class:editing={editingCardId === card.id}
							>
								{#if editingCardId === card.id}
									<textarea
										bind:value={editingCardContent}
										class="mb-2 min-h-[80px] w-full rounded border border-indigo-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
										placeholder="Edit card content..."
									></textarea>
									<div class="flex gap-2">
										<button
											onclick={() => saveEdit(card.id)}
											class="rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700"
										>
											Save
										</button>
										<button
											onclick={cancelEdit}
											class="rounded bg-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-400"
										>
											Cancel
										</button>
									</div>
								{:else}
									<div class="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
										<button
											onclick={() => startEdit(card.id, card.content)}
											class="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
											title="Edit card"
										>
											✏️
										</button>
										<button
											onclick={() => deleteCard(card.id)}
											class="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-red-500 hover:bg-red-100"
											title="Delete card"
										>
											🗑️
										</button>
									</div>
									<div class="prose prose-sm max-w-none">
										{card.content}
									</div>
								{/if}
							</div>
						{/each}
					</div>

					{#if showNewCardForm[column.id]}
						<div class="mb-2 rounded-md border border-gray-300 bg-white p-3">
							<QuillEditor
								bind:this={quillEditors[column.id]}
								placeholder="Enter card content..."
							/>
							<div class="mt-2 flex gap-2">
								<button
									onclick={() => handleCardSubmit(column.id)}
									class="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
								>
									Add Card
								</button>
								<button
									onclick={() => toggleNewCardForm(column.id)}
									class="rounded bg-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-400"
								>
									Cancel
								</button>
							</div>
						</div>
					{:else}
						<button
							onclick={() => toggleNewCardForm(column.id)}
							class="w-full rounded-md px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-200"
						>
							+ Add Card
						</button>
					{/if}
				</div>
			{/each}
		{:else}
			<p class="text-gray-500">No columns found. Create one to get started!</p>
		{/if}
	</div>
</div>

<style>
	:global(.prose) {
		color: #374151;
	}
	:global(.prose h1) {
		font-size: 1.5em;
		font-weight: bold;
		margin: 0.5em 0;
	}
	:global(.prose h2) {
		font-size: 1.25em;
		font-weight: bold;
		margin: 0.5em 0;
	}
	:global(.prose h3) {
		font-size: 1.1em;
		font-weight: 600;
		margin: 0.5em 0;
	}
	:global(.prose ul, .prose ol) {
		margin: 0.5em 0;
		padding-left: 1.5em;
	}
	:global(.prose a) {
		color: #2563eb;
		text-decoration: underline;
	}

	:global(.editing) {
		border-color: #6366f1 !important;
		box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
	}
</style>
