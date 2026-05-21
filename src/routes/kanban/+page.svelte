<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageData } from "./$types";

	export let data: PageData;

	let showForm = false;
	let boardSearch = "";
	let showArchived = false;

	$: filteredBoards = data.boards.filter((board) => {
		if (!boardSearch) return true;
		const q = boardSearch.toLowerCase();
		return (
			board.name.toLowerCase().includes(q) ||
			(board.description && board.description.toLowerCase().includes(q))
		);
	});

	$: filteredArchived = data.archivedBoards.filter((board) => {
		if (!boardSearch) return true;
		const q = boardSearch.toLowerCase();
		return (
			board.name.toLowerCase().includes(q) ||
			(board.description && board.description.toLowerCase().includes(q))
		);
	});

	function timeAgo(unixTs: number | null | undefined): string {
		if (!unixTs) return "";
		const now = Math.floor(Date.now() / 1000);
		const diff = now - unixTs;
		if (diff < 60) return "just now";
		if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
		if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
		if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
		return new Date(unixTs * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
	}
</script>

<div class="p-8">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold">Projects & Boards</h1>
		<button
			class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
			onclick={() => (showForm = !showForm)}
		>
			{showForm ? "Cancel" : "+ New Board"}
		</button>
	</div>

	{#if showForm}
		<form
			method="post"
			action="?/createBoard"
			use:enhance
			class="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-6"
		>
			<h2 class="mb-4 text-lg font-semibold">Create a New Board</h2>

			<label class="mb-2 block text-sm font-medium text-gray-700" for="name">
				Board Name
			</label>
			<input
				type="text"
				id="name"
				name="name"
				required
				placeholder="e.g. Sprint 12"
				class="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
			/>

			<label class="mb-2 block text-sm font-medium text-gray-700" for="projectId">
				Project
			</label>
			<select
				id="projectId"
				name="projectId"
				required
				class="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
			>
				<option value="" disabled selected>Select a project…</option>
				{#each data.projects as project (project.id)}
					<option value={project.id}>{project.name}</option>
				{/each}
			</select>

			<label class="mb-2 block text-sm font-medium text-gray-700" for="description">
				Description <span class="text-gray-400">(optional)</span>
			</label>
			<textarea
				id="description"
				name="description"
				placeholder="e.g. Sprint planning board for the auth module"
				class="mb-6 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
				rows="2"
			></textarea>

			<button
				type="submit"
				class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
			>
				Create Board
			</button>
		</form>
	{/if}

	<div class="mb-4">
		<input
			type="text"
			placeholder="Search boards…"
			bind:value={boardSearch}
			class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
		/>
	</div>

	<!-- Active Boards -->
	{#if filteredBoards.length === 0 && data.boards.length === 0 && data.archivedBoards.length === 0}
		<p class="text-gray-500">No boards yet. Create one above!</p>
	{:else if filteredBoards.length === 0 && data.boards.length === 0}
		<p class="text-gray-500">No active boards.</p>
	{:else if filteredBoards.length === 0}
		<p class="text-gray-500 mb-6">No boards match your search.</p>
	{:else}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each filteredBoards as board (board.id)}
				<div class="group relative block">
					<a
						href={`/kanban/${board.id}`}
						class="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
					>
						<h2 class="mb-2 text-xl font-semibold text-gray-800">{board.name}</h2>
						{#if board.description}
							<p class="mb-3 line-clamp-2 text-sm text-gray-600">{board.description}</p>
						{:else}
							<p class="mb-3 text-sm italic text-gray-400">No description</p>
						{/if}
						<div class="flex gap-4 text-sm text-gray-500">
							<span>📋 {board.columnCount} column{board.columnCount !== 1 ? 's' : ''}</span>
							<span>📝 {board.cardCount} card{board.cardCount !== 1 ? 's' : ''}</span>
						</div>
						{#if board.lastActivity}
							<p class="mt-2 text-xs text-gray-400">Updated {timeAgo(board.lastActivity)}</p>
						{/if}
					</a>
					<form
						method="POST"
						action="?/archiveBoard"
						use:enhance
						class="absolute top-3 right-3 opacity-0 transition-opacity group-hover:opacity-100"
					>
						<input type="hidden" name="boardId" value={board.id} />
						<button
							type="submit"
							class="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-200"
							title="Archive board"
						>📦</button>
					</form>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Archived Boards -->
	{#if data.archivedBoards.length > 0}
		<button
			class="mt-8 mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
			onclick={() => (showArchived = !showArchived)}
		>
			<span>{showArchived ? "▼" : "▶"}</span>
			Archived Boards ({data.archivedBoards.length})
		</button>

		{#if showArchived}
			{#if filteredArchived.length === 0}
				<p class="text-sm text-gray-400">No archived boards match your search.</p>
			{:else}
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each filteredArchived as board (board.id)}
						<div class="group relative block">
							<div class="block rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-sm">
								<h2 class="mb-2 text-xl font-semibold text-gray-500">{board.name}</h2>
								{#if board.description}
									<p class="mb-3 line-clamp-2 text-sm text-gray-400">{board.description}</p>
								{:else}
									<p class="mb-3 text-sm italic text-gray-400">No description</p>
								{/if}
								<div class="flex gap-4 text-sm text-gray-400">
									<span>📋 {board.columnCount} column{board.columnCount !== 1 ? 's' : ''}</span>
									<span>📝 {board.cardCount} card{board.cardCount !== 1 ? 's' : ''}</span>
								</div>
								{#if board.lastActivity}
									<p class="mt-2 text-xs text-gray-300">Updated {timeAgo(board.lastActivity)}</p>
								{/if}
							</div>
							<div class="absolute top-3 right-3 opacity-0 transition-opacity group-hover:opacity-100 flex gap-1">
								<form method="POST" action="?/unarchiveBoard" use:enhance>
									<input type="hidden" name="boardId" value={board.id} />
									<button
										type="submit"
										class="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-600 hover:bg-green-200"
										title="Restore board"
									>↩️</button>
								</form>
								<form
									method="POST"
									action="?/deleteBoard"
									use:enhance
									onsubmit={() => confirm(`Permanently delete the board "${board.name}" and all its columns and cards?`)}
								>
									<input type="hidden" name="boardId" value={board.id} />
									<button
										type="submit"
										class="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-200"
										title="Permanently delete board"
									>🗑️</button>
								</form>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	{/if}
</div>
