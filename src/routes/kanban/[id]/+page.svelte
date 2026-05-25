<script lang="ts">
	import type { PageData } from "./$types";
	import { enhance } from "$app/forms";
	// import { resolve } from "$app/paths";  // not needed
	import { dndzone } from "svelte-dnd-action";
	import QuillEditor from "$lib/components/QuillEditor.svelte";
	import type { CardAssigneeId, CardId, ColumnId, UserId } from "$types/ids";

	// Helper: format a unix timestamp (seconds) as YYYY-MM-DD for date input
	function unixToDateInput(ts: number | null | undefined): string {
		if (!ts) return "";
		const d = new Date(ts * 1000);
		return d.getFullYear() + "-" +
			String(d.getMonth() + 1).padStart(2, "0") + "-" +
			String(d.getDate()).padStart(2, "0");
	}

	function formatRelativeTime(ts: number | null | undefined): string {
		if (!ts) return "";
		const now = Math.floor(Date.now() / 1000);
		const diff = now - ts;
		if (diff < 60) return "just now";
		if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
		if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
		if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
		const d = new Date(ts * 1000);
		return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
	}

	function formatDueDate(ts: number | null | undefined): string {
		if (!ts) return "";
		const now = Math.floor(Date.now() / 1000);
		const d = new Date(ts * 1000);
		const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
		// If due date is today or in the past, add emphasis
		if (ts < now) {
			// Past due
			return "🔴 " + dateStr;
		}
		const oneDay = 86400;
		if (ts < now + oneDay) {
			// Due tomorrow
			return "🟡 " + dateStr;
		}
		return "📅 " + dateStr;
	}

	// Editing state — due dates
	let editingDueDate: Record<string, string> = {};

	let { data }: { data: PageData } = $props();

	// Assignee state
	let assigningCardId: CardId | null = null;

	// Label state
	let showLabelManager = false;
	let newLabelName = "";
	let newLabelColor = "#6366f1";
	let assigningLabelCardId: CardId | null = null;
	let labelColors = [
		"#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
		"#f97316", "#eab308", "#22c55e", "#06b6d4",
		"#3b82f6", "#6b7280",
	];

	async function createLabel() {
		const trimmed = newLabelName.trim();
		if (!trimmed) return;
		const formData = new FormData();
		formData.append("name", trimmed);
		formData.append("color", newLabelColor);
		const response = await fetch("?/createLabel", { method: "POST", body: formData });
		if (response.ok) {
			newLabelName = "";
			window.location.reload();
		}
	}

	async function deleteLabel(labelId: string) {
		if (!confirm("Delete this label? It will be removed from all cards.")) return;
		const formData = new FormData();
		formData.append("labelId", labelId);
		const response = await fetch("?/deleteLabel", { method: "POST", body: formData });
		if (response.ok) window.location.reload();
	}

	async function assignLabel(cardId: CardId, labelId: string) {
		const formData = new FormData();
		formData.append("cardId", cardId);
		formData.append("labelId", labelId);
		const response = await fetch("?/assignLabel", { method: "POST", body: formData });
		if (response.ok) window.location.reload();
	}

	async function removeCardLabel(cardLabelId: string) {
		const formData = new FormData();
		formData.append("cardLabelId", cardLabelId);
		const response = await fetch("?/removeLabel", { method: "POST", body: formData });
		if (response.ok) window.location.reload();
	}

	function toggleAssignPicker(cardId: CardId) {
		assigningCardId = assigningCardId === cardId ? null : cardId;
	}

	async function assignUser(cardId: CardId, userId: UserId) {
		const formData = new FormData();
		formData.append("cardId", cardId);
		formData.append("userId", userId);

		const response = await fetch("?/assignUser", {
			method: "POST",
			body: formData,
		});

		if (response.ok) {
			assigningCardId = null;
			window.location.reload();
		}
	}

	async function unassignUser(assigneeId: CardAssigneeId) {
		const formData = new FormData();
		formData.append("assigneeId", assigneeId);

		const response = await fetch("?/unassignUser", {
			method: "POST",
			body: formData,
		});

		if (response.ok) {
			window.location.reload();
		}
	}

	let showNewColumnForm = false;
	let showNewCardForm: Record<string, boolean> = {};
	let showArchivedCards = false;
	let archivedCards: Array<{ id: CardId; content: string; columnId: ColumnId; dueDate: number | null; column: { name: string } }> | null = null;
	let loadingArchived = false;
	let expandedCards: Record<string, boolean> = {};

	function toggleExpanded(cardId: CardId) {
		expandedCards[cardId] = !expandedCards[cardId];
		expandedCards = { ...expandedCards };
	}

	async function loadArchivedCards() {
		if (archivedCards !== null) {
			// Already loaded, just toggle
			showArchivedCards = !showArchivedCards;
			return;
		}

		loadingArchived = true;
		const response = await fetch("?/getArchivedCards", { method: "POST" });
		if (response.ok) {
			const data = await response.json();
			// Cast IDs to branded types from the server response
			archivedCards = data.archivedCards.map((c: { id: string; content: string; columnId: string; dueDate: number | null; column: { name: string } }) => ({
				...c,
				id: c.id as CardId,
				columnId: c.columnId as ColumnId,
			}));
			showArchivedCards = true;
		}
		loadingArchived = false;
	}
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

	// Card search/filter
	let searchQuery = "";
	let searchInput: HTMLInputElement | undefined = $state();

	// Keyboard shortcuts
	function handleKeydown(e: KeyboardEvent) {
		// Don't intercept when typing in an input/textarea or inside Quill
		const tag = (e.target as HTMLElement).tagName;
		if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).closest(".ql-editor")) {
			// Allow Esc to blur even when in input
			if (e.key === "Escape") {
				(e.target as HTMLElement)?.blur();
			}
			return;
		}
		switch (e.key) {
			case "/":
				e.preventDefault();
				searchInput?.focus();
				break;
			case "n":
			case "N":
				e.preventDefault();
				if (columns.length > 0) {
					const firstColumnId = columns[0].id;
					showNewCardForm = { ...showNewCardForm, [firstColumnId]: true };
				}
				break;
			case "Escape":
				searchQuery = "";
				searchInput?.blur();
				break;
		}
	}
	let filteredColumns = $derived(columns.map(col => ({
		...col,
		items: searchQuery
			? col.items.filter(card =>
					card.content.toLowerCase().includes(searchQuery.toLowerCase())
			  )
			: col.items,
	}));

	$: if (data) {
		columns = transformColumns();
	}

	const flipDurationMs = 200;

	// Column-level drag-and-drop
	function handleColumnDndConsider(e: CustomEvent) {
		columns = e.detail.items;
	}

	async function handleColumnDndFinalize(e: CustomEvent) {
		const finalItems = e.detail.items;
		columns = finalItems;

		// Send only IDs to the server
		const columnIds = finalItems.map((col: { id: string }) => ({ id: col.id }));
		const formData = new FormData();
		formData.append("items", JSON.stringify(columnIds));

		await fetch("?/updateColumnOrder", {
			method: "POST",
			body: formData,
		});
	}

	function handleCardDndConsider(e: CustomEvent, columnId: ColumnId) {
		lockColumns();
		// The source event detail contains the items for the zone that was dragged over
		// We need to find which column the items belong to by matching the payload
		// svelte-dnd-action gives us the items in the order they are in the target zone
		const { items: newItems, info } = e.detail;
		// info.trigger === "dragged" means items were moved from another zone
		// We update the column that received the items
		if (info && info.trigger === "dragged" && newItems) {
			// Update the target column with the new items
			columns = columns.map(col =>
				col.id === columnId ? { ...col, items: newItems } : col,
			);
			// If info.source.items exists, update the source column (items that were removed)
			if (info.source && info.source.items) {
				// Rebuild source column items by removing moved items
				const sourceColumnId = (info.source.el as HTMLElement)?.dataset?.columnId;
				if (sourceColumnId && sourceColumnId !== columnId) {
					columns = columns.map(col =>
						col.id === sourceColumnId
							? { ...col, items: info.source.items }
							: col.id === columnId
								? { ...col, items: newItems }
								: col,
					);
					return;
				}
			}
		}
		// Fallback: intra-column reorder
		columns = columns.map(col =>
			col.id === columnId ? { ...col, items: e.detail.items } : col,
		);
	}

	async function handleCardDndFinalize(e: CustomEvent, columnId: ColumnId) {
		const { items: finalItems, info } = e.detail;
		unlockColumns();

		if (info && info.trigger === "dragged" && finalItems) {
			// Cross-column drag: update both source and target columns
			columns = columns.map(col =>
				col.id === columnId ? { ...col, items: finalItems } : col,
			);

			if (info.source && info.source.items) {
				const sourceColumnId = (info.source.el as HTMLElement)?.dataset?.columnId;
				if (sourceColumnId && sourceColumnId !== columnId) {
					columns = columns.map(col =>
						col.id === sourceColumnId
							? { ...col, items: info.source.items }
							: col.id === columnId
								? { ...col, items: finalItems }
								: col,
					);
				}
			}

			// Send updates for ALL columns that changed
			const promises: Promise<Response>[] = [];
			for (const col of columns) {
				const formData = new FormData();
				formData.append("items", JSON.stringify(col.items));
				formData.append("columnId", col.id);
				promises.push(
					fetch("?/updateCardOrder", {
						method: "POST",
						body: formData,
					}),
				);
			}
			await Promise.all(promises);
			return;
		}

		// Intra-column drag: update just this column
		columns = columns.map(col =>
			col.id === columnId ? { ...col, items: e.detail.items } : col,
		);

		const formData = new FormData();
		formData.append("items", JSON.stringify(e.detail.items));
		formData.append("columnId", columnId);

		await fetch("?/updateCardOrder", {
			method: "POST",
			body: formData,
		});
	}

	// Editing state — cards
	let editingCardId: CardId | null = null;
	let editingCardContent: string = "";

	// Editing state — board description
	let editingDescription = false;
	let editingDescriptionText: string = "";

	function startEditDescription() {
		editingDescriptionText = data.board.description || "";
		editingDescription = true;
	}

	function cancelEditDescription() {
		editingDescription = false;
		editingDescriptionText = "";
	}

	async function saveEditDescription() {
		const formData = new FormData();
		formData.append("description", editingDescriptionText);

		const response = await fetch("?/updateBoard", {
			method: "POST",
			body: formData,
		});

		if (response.ok) {
			editingDescription = false;
			window.location.reload();
		}
	}

	// Column color editing state
	let editingColumnColor: { columnId: ColumnId; swatchOpen: boolean } | null = null;

	function toggleColumnColorSwatch(col: { id: ColumnId }) {
		if (editingColumnColor?.columnId === col.id) {
			editingColumnColor = null;
		} else {
			editingColumnColor = { columnId: col.id, swatchOpen: true };
		}
	}

	async function updateColumnColor(columnId: ColumnId, color: string) {
		const formData = new FormData();
		formData.append("columnId", columnId);
		formData.append("color", color);
		const response = await fetch("?/updateColumnColor", { method: "POST", body: formData });
		if (response.ok) {
			editingColumnColor = null;
			window.location.reload();
		}
	}

	// Editing state — columns
	let editingColumnId: ColumnId | null = null;
	let editingColumnName: string = "";
	let editingColumnFormColor: string = "#6366f1";

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

	async function archiveCard(cardId: CardId) {
		const formData = new FormData();
		formData.append("cardId", cardId);

		const response = await fetch("?/archiveCard", {
			method: "POST",
			body: formData,
		});

		if (response.ok) {
			window.location.reload();
		}
	}

	async function unarchiveCard(cardId: CardId) {
		const formData = new FormData();
		formData.append("cardId", cardId);

		const response = await fetch("?/unarchiveCard", {
			method: "POST",
			body: formData,
		});

		if (response.ok) {
			// Refresh archived list
			archivedCards = null;
			loadArchivedCards();
		}
	}

	// Due date editing — toggles a date picker inline
	function toggleDueDatePicker(cardId: CardId, currentTs: number | null | undefined) {
		const key = cardId;
		if (editingDueDate[key] !== undefined) {
			// Already editing — close it
			const newState = { ...editingDueDate };
			delete newState[key];
			editingDueDate = newState;
		} else {
			editingDueDate = { ...editingDueDate, [key]: unixToDateInput(currentTs) };
		}
	}

	async function saveDueDate(cardId: CardId) {
		const val = editingDueDate[cardId] || "";
		const formData = new FormData();
		formData.append("cardId", cardId);
		formData.append("dueDate", val);

		const response = await fetch("?/setDueDate", {
			method: "POST",
			body: formData,
		});

		if (response.ok) {
			const newState = { ...editingDueDate };
			delete newState[cardId];
			editingDueDate = newState;
			window.location.reload();
		} else {
			alert("Failed to set due date.");
		}
	}

	async function clearDueDate(cardId: CardId) {
		const formData = new FormData();
		formData.append("cardId", cardId);
		formData.append("dueDate", "");

		const response = await fetch("?/setDueDate", {
			method: "POST",
			body: formData,
		});

		if (response.ok) {
			const newState = { ...editingDueDate };
			delete newState[cardId];
			editingDueDate = newState;
			window.location.reload();
		} else {
			alert("Failed to clear due date.");
		}
	}

	function startEditColumn(columnId: ColumnId, name: string) {
		editingColumnId = columnId;
		editingColumnName = name;
	}

	function cancelEditColumn() {
		editingColumnId = null;
		editingColumnName = "";
	}

	async function saveEditColumn(columnId: ColumnId) {
		const trimmed = editingColumnName.trim();
		if (!trimmed) {
			alert("Column name cannot be empty.");
			return;
		}

		const formData = new FormData();
		formData.append("columnId", columnId);
		formData.append("name", editingColumnName);

		const response = await fetch("?/updateColumn", {
			method: "POST",
			body: formData,
		});

		if (response.ok) {
			editingColumnId = null;
			window.location.reload();
		} else {
			alert("Failed to update column. Please try again.");
		}
	}

	async function deleteBoard() {
		if (!confirm(`Delete the board "${data.board.name}" and all its columns and cards?`)) return;

		const response = await fetch("?/deleteBoard", {
			method: "POST",
		});

		if (response.ok) {
			// Redirect to board list
			window.location.href = "/kanban";
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

<div class="max-w-full p-8" onkeydown={handleKeydown}>
	<!-- Card search/filter bar -->
	<div class="mb-4">
		<input
			type="search"
			bind:value={searchQuery}
			bind:this={searchInput}
			placeholder="🔍 Search cards across all columns…  (press / to focus)"
			class="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
		/>
		{#if searchQuery}
			<span class="ml-2 text-xs text-gray-400">
				Filtering by "{searchQuery}"
				<button onclick={() => (searchQuery = "")} class="ml-1 text-indigo-600 hover:text-indigo-800">✕</button>
			</span>
		{/if}
	</div>

	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="mb-1 text-2xl font-bold">{data.board.name}</h1>
			{#if editingDescription}
				<div class="mb-2 flex items-start gap-2">
					<textarea
						bind:value={editingDescriptionText}
						class="w-full max-w-md rounded border border-indigo-300 p-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
						placeholder="Add a description…"
						rows="2"
					></textarea>
					<div class="flex flex-col gap-1">
						<button
							onclick={saveEditDescription}
							class="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700"
							title="Save"
						>💾</button>
						<button
							onclick={cancelEditDescription}
							class="rounded bg-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-400"
							title="Cancel"
						>✕</button>
					</div>
				</div>
			{:else if data.board.description}
				<p
					class="mb-2 cursor-pointer text-sm text-gray-500 hover:text-indigo-600"
					onclick={startEditDescription}
					title="Edit description"
				>
					{data.board.description}
				</p>
			{:else}
				<button
					onclick={startEditDescription}
					class="mb-2 cursor-pointer text-sm text-gray-400 hover:text-indigo-600"
				>
					+ Add description
				</button>
			{/if}
			{#if data.boardStats}
				<div class="mt-2 flex flex-wrap items-center gap-3 text-sm">
					<span class="text-gray-500">
						{data.boardStats.totalCards} card{data.boardStats.totalCards === 1 ? '' : 's'}
					</span>
					{#if data.boardStats.overdueCards > 0}
						<span class="font-medium text-red-600">
							🔴 {data.boardStats.overdueCards} overdue
						</span>
					{/if}
					{#if data.boardStats.dueToday > 0}
						<span class="font-medium text-amber-600">
							🟡 {data.boardStats.dueToday} due today
						</span>
					{/if}
					{#if data.boardStats.dueSoon > 0}
						<span class="text-amber-500">
							📅 {data.boardStats.dueSoon} due soon
						</span>
					{/if}
					{#if data.boardStats.unassignedCards > 0}
						<span class="text-gray-400">
							👤 {data.boardStats.unassignedCards} unassigned
						</span>
					{/if}
				</div>
			{/if}
			<a href="/kanban" class="text-blue-600 hover:underline"
				>← Back to Boards</a
			>
		</div>
		<div class="flex items-center gap-3">
			<button
				onclick={() => (showNewColumnForm = !showNewColumnForm)}
				class="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
				title="Add a new column to the board"
			>
				+ New Column
			</button>
			<button
				onclick={() => (showLabelManager = !showLabelManager)}
				class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
				title="Manage labels"
			>
				🏷️ Labels
			</button>
			<button
				onclick={deleteBoard}
				class="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
				title="Delete this board"
			>
				🗑️ Delete Board
			</button>
		</div>
	</div>



	{#if showLabelManager}
		<div class="mb-6 max-w-md rounded-lg border border-gray-200 bg-white p-4">
			<h3 class="mb-3 font-semibold">Manage Labels</h3>

			<!-- Existing labels -->
			{#if data.labels.length > 0}
				<div class="mb-3 flex flex-wrap gap-2">
					{#each data.labels as label (label.id)}
						<div class="group flex items-center gap-1 rounded-full px-3 py-1 text-xs text-white" style="background-color: {label.color}">
							{label.name}
							<button
								onclick={() => deleteLabel(label.id)}
								class="ml-1 opacity-60 hover:opacity-100"
								title="Delete label"
							>✕</button>
						</div>
					{/each}
				</div>
			{:else}
				<p class="mb-3 text-sm text-gray-400">No labels yet. Create one below.</p>
			{/if}

			<!-- New label form -->
			<div class="flex items-end gap-2">
				<div class="flex-1">
					<label class="mb-1 block text-xs font-medium text-gray-600" for="newLabelName">Label name</label>
					<input
						type="text"
						id="newLabelName"
						bind:value={newLabelName}
						placeholder="e.g. Bug"
						class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
						onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), createLabel())}
					/>
				</div>
				<div>
					<label class="mb-1 block text-xs font-medium text-gray-600">Color</label>
					<div class="flex gap-1">
						{#each labelColors as color (color)}
							<button
								onclick={() => newLabelColor = color}
								class="h-6 w-6 rounded-full border-2 transition-all"
								style="background-color: {color}; {newLabelColor === color ? 'border-color: #374151; transform: scale(1.15);' : 'border-color: transparent'}"
								title={color}
							></button>
						{/each}
					</div>
				</div>
				<button
					onclick={createLabel}
					class="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
				>Add</button>
			</div>
		</div>
	{/if}

	<div
		use:dndzone={{ items: searchQuery ? [] : columns, flipDurationMs, type: "column" }}
		onconsider={searchQuery ? () => {} : handleColumnDndConsider}
		onfinalize={searchQuery ? () => {} : handleColumnDndFinalize}
		class="flex gap-4 overflow-x-auto pb-4"
	>
		{#if (searchQuery ? filteredColumns : columns).length > 0}
			{#each (searchQuery ? filteredColumns : columns) as column (column.id)}
				<div
					data-column-id={column.id}
					class="w-80 flex-shrink-0 rounded-lg bg-gray-100 p-4 border-l-4"
					style="border-left-color: {column.color};"
				>
					<div class="mb-4 flex items-center justify-between">
						{#if editingColumnId === column.id}
							<div class="flex flex-1 items-center gap-2">
								<input
									type="text"
									bind:value={editingColumnName}
									class="flex-1 rounded border border-indigo-300 px-2 py-1 text-sm font-semibold focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
									placeholder="Column name"
								/>
								<button
									onclick={() => saveEditColumn(column.id)}
									class="rounded bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700"
									title="Save"
								>
									💾
								</button>
								<button
									onclick={cancelEditColumn}
									class="rounded bg-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-400"
									title="Cancel"
								>
									✕
								</button>
							</div>
							<div class="mt-2">
								<label class="mb-1 block text-xs font-medium text-gray-600">Color</label>
								<div class="flex flex-wrap gap-1">
									{#each labelColors as color (color)}
										<button
											onclick={(e) => { e.stopPropagation(); updateColumnColor(column.id, color); }}
											class="h-6 w-6 rounded-full border-2 transition-all hover:scale-110"
											style="background-color: {color}; {column.color == color ? 'border-color: #374151; transform: scale(1.15);' : 'border-color: transparent'}"
											title={color}
										></button>
									{/each}
								</div>
							</div>
						{:else}
							<div class="flex items-center gap-2">
								<h2
									class="cursor-pointer text-lg font-semibold hover:text-indigo-600"
									onclick={() => startEditColumn(column.id, column.name)}
									title="Rename column"
								>
									{column.name}
								</h2>
								<span class="inline-flex items-center justify-center rounded-full bg-gray-300 px-2 py-0.5 text-xs font-medium text-gray-700" title="Card count">
									{column.items.length}
								</span>
								<!-- Color swatch button -->
								<button
									onclick={(e) => { e.stopPropagation(); toggleColumnColorSwatch(column); }}
									class="h-5 w-5 rounded-full border-2 border-gray-300 transition-transform hover:scale-110 flex-shrink-0"
									style="background-color: {column.color};"
									title="Change column color"
								></button>
							</div>
							<div class="flex items-center gap-1">
								<button
									onclick={() => deleteColumn(column.id)}
									class="text-sm text-red-500 hover:text-red-700"
									title="Delete column"
								>
									✕
								</button>
							</div>
						{/if}
					</div>

					{#if editingColumnColor?.columnId === column.id}
						<div class="mb-3 rounded-md border border-gray-200 bg-white p-2 shadow-sm" onclick={(e) => e.stopPropagation()}>
							<p class="mb-1 text-xs font-medium text-gray-600">Color</p>
							<div class="flex flex-wrap gap-1">
								{#each labelColors as color (color)}
									<button
										onclick={(e) => { e.stopPropagation(); updateColumnColor(column.id, color); }}
										class="h-6 w-6 rounded-full border-2 transition-all hover:scale-110"
										style="background-color: {color}; {column.color == color ? 'border-color: #374151; transform: scale(1.15);' : 'border-color: transparent'}"
										title={color}
									></button>
								{/each}
							</div>
						</div>
					{/if}

					<div
						data-column-id={column.id}
						use:dndzone={{ items: column.items, flipDurationMs, type: "card" }}
						onconsider={e => handleCardDndConsider(e, column.id)}
						onfinalize={e => handleCardDndFinalize(e, column.id)}
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
											onclick={() => toggleDueDatePicker(card.id, card.dueDate)}
											class="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
											title="Set or edit due date"
										>
											📅
										</button>
										<button
											onclick={() => toggleAssignPicker(card.id)}
											class="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 hover:bg-indigo-100"
											title="Assign to user"
										>
											👤
										</button>
										<button
											onclick={() => (assigningLabelCardId = assigningLabelCardId === card.id ? null : card.id)}
											class="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 hover:bg-yellow-100"
											title="Add/remove labels"
										>
											🏷️
										</button>
										<button
											onclick={() => archiveCard(card.id)}
											class="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 hover:bg-yellow-100"
											title="Archive card"
										>
											📦
										</button>
										<button
											onclick={() => deleteCard(card.id)}
											class="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-red-500 hover:bg-red-100"
											title="Delete card"
										>
											🗑️
										</button>
									</div>
										<div class="prose prose-sm max-w-none" class:expanded={expandedCards[card.id]}>
										<div class="line-clamp-6" class:line-clamp-none={expandedCards[card.id]}>
											{@html card.content}
										</div>
										{#if !expandedCards[card.id]}
											<button
												onclick={() => toggleExpanded(card.id)}
												class="mt-1 text-xs text-indigo-600 hover:text-indigo-800"
											>... more</button>
										{/if}
									</div>
									<!-- Labels -->
									{#if card.labels && card.labels.length > 0}
										<div class="mt-1.5 flex flex-wrap gap-1">
											{#each card.labels as cl (cl.id)}
												<span
													class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs text-white"
													style="background-color: {cl.label.color}"
													title={cl.label.name}
												>
													{cl.label.name}
													<button
														onclick={(e) => { e.stopPropagation(); removeCardLabel(cl.id); }}
														class="ml-0.5 opacity-60 hover:opacity-100"
														title="Remove label"
													>✕</button>
												</span>
											{/each}
										</div>
									{/if}
									{#if editingDueDate[card.id] !== undefined}
										<div class="mt-2 flex items-center gap-1">
											<input
												type="date"
												bind:value={editingDueDate[card.id]}
												class="w-full rounded border border-indigo-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
											/>
											<button
												onclick={() => saveDueDate(card.id)}
												class="rounded bg-indigo-600 px-1.5 py-1 text-xs text-white hover:bg-indigo-700"
												title="Save due date"
											>💾</button>
											<button
												onclick={() => clearDueDate(card.id)}
												class="rounded bg-red-100 px-1.5 py-1 text-xs text-red-600 hover:bg-red-200"
												title="Clear due date"
											>✕</button>
										</div>
									{:else if card.dueDate}
										<button
											onclick={() => toggleDueDatePicker(card.id, card.dueDate)}
											class="mt-1 cursor-pointer text-xs hover:text-indigo-600"
											title="Edit due date"
										>
											{formatDueDate(card.dueDate)}
										</button>
									{/if}
									<!-- Last edited indicator -->
									{#if card.updatedAt && !editingCardId}
										<div class="mt-2 text-[10px] text-gray-400" title={new Date(card.updatedAt * 1000).toLocaleString()}>
											Edited {formatRelativeTime(card.updatedAt)}
										</div>
									{/if}
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

			<!-- Quick-add column button at end of column list -->
			<div class="w-80 flex-shrink-0">
				{#if showNewColumnForm}
					<form
						method="POST"
						action="?/createColumn"
						use:enhance
						class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4"
					>
						<h3 class="mb-2 text-sm font-semibold text-gray-600">New Column</h3>
						<input
							type="text"
							name="name"
							placeholder="Column name"
							required
							class="mb-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
						/>
						<div class="mb-3">
							<label class="mb-1 block text-xs font-medium text-gray-600">Column Color</label>
							<div class="flex gap-1">
								{#each labelColors as color (color)}
									<label class="cursor-pointer">
										<input type="radio" name="color" value="{color}" checked={color === '#6366f1'} class="sr-only" />
										<div
											class="h-6 w-6 rounded-full border-2 transition-all"
											style="background-color: {color};"
										></div>
									</label>
								{/each}
							</div>
						</div>
						<div class="flex gap-2">
							<button
								type="submit"
								class="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
							>
								Create
							</button>
							<button
								type="button"
								onclick={() => (showNewColumnForm = false)}
								class="rounded-md bg-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-400"
							>
								Cancel
							</button>
						</div>
					</form>
				{:else}
					<button
						onclick={() => (showNewColumnForm = true)}
						class="flex h-full min-h-[120px] w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500 transition-colors hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600"
					>
						<span class="flex items-center gap-2">
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
							Add Column
						</span>
					</button>
				{/if}
			</div>
		{:else}
			<div class="flex w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12">
				<div class="text-center">
					<p class="mb-4 text-lg text-gray-500">This board has no columns yet.</p>
					<p class="mb-6 text-sm text-gray-400">Create your first column to start organizing cards.</p>
					<button
						onclick={() => (showNewColumnForm = true)}
						class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
					>
						+ Add Your First Column
					</button>
				</div>
			</div>
		{/if}
	</div>


									<!-- Archived cards section -->
	<div class="mt-8 border-t border-gray-200 pt-4">
		<button
			onclick={loadArchivedCards}
			class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
		>
			{showArchivedCards ? "▼" : "▶"} 📦 Archived Cards
			{#if loadingArchived}
				<span class="text-xs text-gray-400">Loading...</span>
			{/if}
		</button>

		{#if showArchivedCards && archivedCards && archivedCards.length > 0}
			<div class="mt-3 space-y-2">
				{#each archivedCards as card (card.id)}
					<div class="flex items-center justify-between rounded-md border border-gray-200 bg-yellow-50 p-3">
						<div class="flex-1">
							<div class="prose prose-sm max-w-none">
								{@html card.content}
							</div>
							<p class="mt-1 text-xs text-gray-500">
								From column: <span class="font-medium">{card.column.name}</span>
								{#if card.dueDate}
									· {formatDueDate(card.dueDate)}
								{/if}
							</p>
						</div>
						<button
							onclick={() => unarchiveCard(card.id)}
							class="rounded bg-green-100 px-2 py-1 text-xs text-green-700 hover:bg-green-200"
							title="Restore card to board"
						>
							↩️ Restore
						</button>
					</div>
				{/each}
			</div>
		{:else if showArchivedCards}
			<p class="mt-3 text-sm text-gray-400">No archived cards.</p>
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
