<script lang="ts">
	import { enhance } from "$app/forms";
	import { page } from "$app/state";
	import type { PageData } from "./$types";

	const { data } = $props<{ data: PageData }>();

	let editingName = $state(false);
	let editNameValue = $state(data.project.name);
	let showDeleteConfirm = $state(false);

	function timeAgo(unixTs: number): string {
		const now = Math.floor(Date.now() / 1000);
		const diff = now - unixTs;
		if (diff < 60) return "just now";
		if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
		if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
		if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
		return new Date(unixTs * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
	}

	function roleBadgeColor(role: string): string {
		switch (role) {
			case "admin": return "bg-purple-700/60 text-purple-200";
			case "contributor": return "bg-blue-700/60 text-blue-200";
			case "viewer": return "bg-zinc-700/60 text-zinc-300";
			default: return "bg-zinc-700/60 text-zinc-300";
		}
	}
</script>

<div class="mx-auto max-w-3xl p-6">
	<!-- Breadcrumb -->
	<a href="/project/{page.params.projectId}" class="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white">
		← Back to {data.project.name}
	</a>

	<h1 class="mb-8 text-2xl font-bold">Project Settings</h1>

	<!-- Project Name Section -->
	<section class="mb-10 rounded-lg border border-zinc-700 bg-zinc-800 p-6">
		<h2 class="mb-4 text-lg font-semibold">Project Name</h2>
		{#if editingName}
			<form
				method="POST"
				action="?/updateProjectName"
				use:enhance
				onsubmit={() => { editingName = false; }}
				class="flex items-center gap-2"
			>
				<input
					type="text"
					name="name"
					bind:value={editNameValue}
					class="rounded-md border border-zinc-500 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
					required
				/>
				<button type="submit" class="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500">Save</button>
				<button type="button" onclick={() => editingName = false} class="rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:text-white">Cancel</button>
			</form>
		{:else}
			<div class="flex items-center gap-3">
				<span class="text-lg">{data.project.name}</span>
				<button
					onclick={() => { editNameValue = data.project.name; editingName = true; }}
					class="rounded-md px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
				>
					✏️ Edit
				</button>
			</div>
		{/if}
		<div class="mt-2 text-xs text-zinc-500">
			Project ID: <code class="rounded bg-zinc-900 px-1 py-0.5 text-zinc-400">{page.params.projectId}</code>
		</div>
	</section>

	<!-- Members Section -->
	<section class="mb-10 rounded-lg border border-zinc-700 bg-zinc-800 p-6">
		<h2 class="mb-4 text-lg font-semibold">Members ({data.members.length})</h2>

		<div class="flex flex-col gap-2">
			{#each data.members as member (member.userId)}
				<div class="flex items-center justify-between rounded-md border border-zinc-700 bg-zinc-900 px-4 py-3">
					<div class="flex flex-col gap-0.5">
						<div class="flex items-center gap-2">
							<span class="font-medium">
								{#if member.name}
									{member.name}
								{:else}
									<span class="italic text-zinc-500">Unnamed</span>
								{/if}
							</span>
							{#if member.userId === data.currentUserId}
								<span class="rounded-md bg-zinc-700 px-1.5 py-0.5 text-xs text-zinc-300">you</span>
							{/if}
						</div>
						<span class="text-sm text-zinc-400">{member.email}</span>
						<span class="text-xs text-zinc-500">Joined {timeAgo(member.joinedAt)}</span>
					</div>

					<div class="flex items-center gap-3">
						<!-- Role badge -->
						<span class="rounded-md px-2 py-1 text-xs font-medium {roleBadgeColor(member.role)}">
							{member.role}
						</span>

						<!-- Role change form -->
						<form
							method="POST"
							action="?/updateMemberRole"
							use:enhance
							class="flex items-center gap-1"
						>
							<input type="hidden" name="userId" value={member.userId} />
							<select
								name="role"
								class="rounded-md border border-zinc-600 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 focus:border-blue-500 focus:outline-none"
								onchange="this.form.requestSubmit()"
							>
								<option value="admin" selected={member.role === 'admin'}>Admin</option>
								<option value="contributor" selected={member.role === 'contributor'}>Contributor</option>
								<option value="viewer" selected={member.role === 'viewer'}>Viewer</option>
							</select>
						</form>

						<!-- Remove form (can't remove self) -->
						{#if member.userId !== data.currentUserId}
							<form
								method="POST"
								action="?/removeMember"
								use:enhance
								onsubmit={() => confirm('Remove this member from the project?')}
							>
								<input type="hidden" name="userId" value={member.userId} />
								<button
									type="submit"
									class="rounded-md px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-800/50 hover:text-red-300"
									title="Remove member"
								>
									✕
								</button>
							</form>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- Danger Zone -->
	<section class="rounded-lg border border-red-800/60 bg-red-950/30 p-6">
		<h2 class="mb-4 text-lg font-semibold text-red-400">Danger Zone</h2>
		<p class="mb-4 text-sm text-zinc-400">
			Deleting this project will permanently remove all boards, columns, cards, and member associations. This cannot be undone.
		</p>

		{#if !showDeleteConfirm}
			<button
				onclick={() => showDeleteConfirm = true}
				class="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
			>
				Delete Project
			</button>
		{:else}
			<div class="flex flex-col gap-3 rounded-md border border-red-800 bg-red-950/50 p-4">
				<p class="text-sm font-medium text-red-300">Are you absolutely sure?</p>
				<form
					method="POST"
					action="?/deleteProject"
					use:enhance
					onsubmit={() => confirm(`This will permanently delete "${data.project.name}" and all its boards. Are you sure?`)}
					class="flex items-center gap-3"
				>
					<button
						type="submit"
						class="rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
					>
						Yes, delete "{data.project.name}"
					</button>
					<button
						type="button"
						onclick={() => showDeleteConfirm = false}
						class="rounded-lg bg-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-600"
					>
						Cancel
					</button>
				</form>
			</div>
		{/if}
	</section>
</div>
