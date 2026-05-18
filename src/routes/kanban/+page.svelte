<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageData } from "./$types";

	export let data: PageData;

	let showForm = false;
</script>

<div class="p-8">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold">Projects & Boards</h1>
		<button
			class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
			on:click={() => (showForm = !showForm)}
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
				class="mb-6 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
			>
				<option value="" disabled selected>Select a project…</option>
				{#each data.projects as project (project.id)}
					<option value={project.id}>{project.name}</option>
				{/each}
			</select>

			<button
				type="submit"
				class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
			>
				Create Board
			</button>
		</form>
	{/if}

	{#if data.boards.length === 0}
		<p class="text-gray-500">No boards yet. Create one above!</p>
	{:else}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each data.boards as board (board.id)}
				<a
					href={`/kanban/${board.id}`}
					class="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
				>
					<h2 class="mb-2 text-xl font-semibold text-gray-800">{board.name}</h2>
					<div class="flex gap-4 text-sm text-gray-500">
						<span>📋 {board.columnCount} column{board.columnCount !== 1 ? 's' : ''}</span>
						<span>📝 {board.cardCount} card{board.cardCount !== 1 ? 's' : ''}</span>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
