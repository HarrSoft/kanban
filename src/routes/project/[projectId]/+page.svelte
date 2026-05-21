<script lang="ts">
	import { Project } from "$com";
	import { page } from "$app/state";
	import { getProject } from "$lib/remote";
	import { UserInfo } from "$types";
	import type { PageData } from "./$types";

	const { data } = $props<{ data: PageData }>();
	const project = $derived(await getProject(page.params.projectId!));
</script>

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-2">
		<Project {project} />

		<!-- Project members -->
		{#if project.admins.length > 0}
			<h2 class="text-lg font-bold">Project Admins</h2>
			{#each project.admins as admin (admin.id)}
				{@render userLine(admin)}
			{/each}
		{/if}
		{#if project.contributors.length > 0}
			<h2 class="text-lg font-bold">Project Contributors</h2>
			{#each project.contributors as contributor (contributor.id)}
				{@render userLine(contributor)}
			{/each}
		{/if}
		{#if project.viewers.length > 0}
			<h2 class="text-lg font-bold">Project Viewers</h2>
			{#each project.viewers as viewer (viewer.id)}
				{@render userLine(viewer)}
			{/each}
		{/if}
	</div>

	<!-- Boards -->
	{#if data.boards.length > 0}
		<div class="flex flex-col gap-2">
			<h2 class="text-lg font-bold">Kanban Boards</h2>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
				{#each data.boards as board (board.id)}
					<a
						href="/kanban/{board.id}"
						class="flex flex-col gap-1 rounded-lg border border-zinc-700 bg-zinc-800 p-4 transition-colors hover:border-zinc-500"
					>
						<span class="font-semibold">{board.name}</span>
						{#if board.description}
							<span class="text-sm text-zinc-400">{board.description}</span>
						{/if}
						<span class="mt-1 text-xs text-zinc-500">
							{board.columnCount} column{board.columnCount === 1 ? '' : 's'} · {board.cardCount} card{board.cardCount === 1 ? '' : 's'}
						</span>
					</a>
				{/each}
			</div>
		</div>
	{/if}
</div>

{#snippet userLine(user: UserInfo)}
	<div class="flex gap-2">
		{#if user.name}
			<span>{user.name} ({user.email})</span>
		{:else}
			<span>{user.email}</span>
		{/if}
	</div>
{/snippet}
