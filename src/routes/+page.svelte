<script lang="ts">
	import type { PageData } from "./$types";

	const { data } = $props<{ data: PageData }>();
</script>

{#if !data.session}
	<!-- User isn't logged in -->
	<div class="flex h-full w-full flex-col items-center justify-center gap-4">
		<h1 class="text-3xl font-bold">Harrsoft Kanban</h1>
		<p class="text-zinc-400">Sign in to manage your projects and boards</p>
		<a
			href="/login"
			class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
		>
			Sign In
		</a>
	</div>
{:else}
	<div class="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<h1 class="text-2xl font-bold">Dashboard</h1>
			<div class="flex items-center gap-3 text-sm text-zinc-400">
				<span>{data.projects.length} project{data.projects.length === 1 ? "" : "s"}</span>
				<a href="/settings" class="text-blue-400 hover:underline">Settings</a>
			</div>
		</div>

		<!-- Active Project -->
		{#if data.activeProject}
			<section class="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
				<h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
					Active Project
				</h2>
				<a
					href="/project/{data.activeProject.id}"
					class="flex items-center justify-between rounded-md bg-zinc-800 p-4 transition-colors hover:bg-zinc-700"
				>
					<div class="flex items-center gap-3">
						<span class="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-700 text-xl">
							🎁
						</span>
						<div>
							<span class="font-semibold">{data.activeProject.name}</span>
							<div class="text-sm text-zinc-400">
								{data.activeProject.boardCount} board{data.activeProject.boardCount === 1 ? "" : "s"}
							</div>
						</div>
					</div>
					<span class="text-sm text-blue-400">Open →</span>
				</a>
			</section>
		{/if}

		<!-- All Projects -->
		<section>
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold uppercase tracking-wide text-zinc-400">
					All Projects
				</h2>
				<a
					href="/kanban"
					class="text-sm text-blue-400 hover:underline"
				>
					View All Boards
				</a>
			</div>

			{#if data.projects.length > 0}
				<div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{#each data.projects as project (project.id)}
						<a
							href="/project/{project.id}"
							class="flex flex-col gap-2 rounded-lg border border-zinc-700 bg-zinc-800 p-4 transition-colors hover:border-zinc-500"
						>
							<div class="flex items-center gap-3">
								<span class="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-700 text-lg">
									🎁
								</span>
								<span class="font-semibold">{project.name}</span>
							</div>
							<div class="mt-1 flex gap-3 text-xs text-zinc-500">
								<span>{project.boardCount} board{project.boardCount === 1 ? "" : "s"}</span>
								<span>{project.memberCount} member{project.memberCount === 1 ? "" : "s"}</span>
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<div class="mt-3 rounded-lg border border-dashed border-zinc-700 p-8 text-center">
					<p class="text-zinc-500">No projects yet</p>
					<p class="mt-1 text-xs text-zinc-600">
						Ask an admin to create a project to get started
					</p>
				</div>
			{/if}
		</section>
	</div>
{/if}
