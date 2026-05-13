<script lang="ts">
	import type { PageData } from "./$types";

	export let data: PageData;
</script>

<div class="p-8">
	<h1 class="mb-6 text-2xl font-bold">Projects & Boards</h1>

	{#if data.boards.length === 0}
		<p class="text-gray-500">No boards found. Run the seed script!</p>
	{:else}
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each data.boards as board}
				<a
					href="/kanban/{board.id}"
					class="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
				>
					<h2 class="mb-2 text-xl font-semibold text-gray-800">{board.name}</h2>
					<p class="text-sm text-gray-500">Project ID: {board.projectId}</p>
				</a>
			{/each}
		</div>
	{/if}
</div>
