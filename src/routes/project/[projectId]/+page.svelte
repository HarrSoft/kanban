<script lang="ts">
	import { Project } from "$com";
	import { page } from "$app/state";
	import { enhance } from "$app/forms";
	import { getProject } from "$lib/remote";
	import { UserInfo } from "$types";
	import type { PageData } from "./$types";

	const { data } = $props<{ data: PageData }>();
	const project = $derived(await getProject(page.params.projectId!));

	let showCreateForm = $state(false);
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
	<div class="flex flex-col gap-2">
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-bold">Kanban Boards</h2>
			<button
				class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
				onclick={() => showCreateForm = !showCreateForm}
			>
				{showCreateForm ? 'Cancel' : '+ New Board'}
			</button>
		</div>

		{#if showCreateForm}
			<form method="POST" action="?/createBoard" use:enhance class="flex flex-col gap-3 rounded-lg border border-zinc-700 bg-zinc-800 p-4">
				<input
					type="text"
					name="name"
					placeholder="Board name"
					class="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
					required
				/>
				<textarea
					name="description"
					placeholder="Description (optional)"
					rows="2"
					class="rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
				></textarea>
				<div class="flex justify-end gap-2">
					<button
						type="button"
						class="rounded-md px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
						onclick={() => showCreateForm = false}
					>Cancel</button>
					<button
						type="submit"
						class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
					>Create Board</button>
				</div>
			</form>
		{/if}

		{#if data.boards.length > 0}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
				{#each data.boards as board (board.id)}
					<div class="relative group">
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
						<form
							method="POST"
							action="?/deleteBoard"
							use:enhance
							class="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
							onsubmit="return confirm('Delete board \`{board.name}\` and all its cards? This cannot be undone.')"
						>
							<input type="hidden" name="boardId" value="{board.id}" />
							<button
								type="submit"
								class="rounded-md bg-red-700/80 px-2 py-0.5 text-xs text-white transition-colors hover:bg-red-600"
								title="Delete board"
							>✕</button>
						</form>
					</div>
				{/each}
			</div>
		{:else}
			<p class="text-sm text-zinc-500">No boards yet. Create one above.</p>
		{/if}
	</div>
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
