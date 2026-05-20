<script lang="ts">
	import { enhance } from "$app/forms";
	import type { PageData } from "./$types";

	export let data: PageData;
	export let form: import("./$types").ActionData | null = null;
</script>

<div class="mx-auto max-w-2xl p-8">
	<h1 class="mb-8 text-2xl font-bold">Settings</h1>

	{#if !data.user}
		<p class="text-gray-500">You must be logged in to view settings.</p>
	{/if}

	<!-- Profile Section -->
	<section class="mb-10 rounded-lg border border-gray-200 bg-white p-6">
		<h2 class="mb-6 text-lg font-semibold">Profile</h2>
		<form method="POST" action="?/updateProfile" use:enhance class="space-y-4">
			<div>
				<label for="email" class="mb-1 block text-sm font-medium text-gray-700">Email</label>
				<input
					type="email"
					id="email"
					name="email"
					value={data.user.email}
					required
					class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
				/>
			</div>

			<div>
				<label for="name" class="mb-1 block text-sm font-medium text-gray-700">
					Display Name <span class="text-gray-400">(optional)</span>
				</label>
				<input
					type="text"
					id="name"
					name="name"
					value={data.user.name ?? ""}
					maxlength="100"
					placeholder="Your display name"
					class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
				/>
			</div>

			<div>
				<label for="bio" class="mb-1 block text-sm font-medium text-gray-700">
					Bio <span class="text-gray-400">(optional)</span>
				</label>
				<textarea
					id="bio"
					name="bio"
					maxlength="500"
					rows="3"
					placeholder="Tell us about yourself…"
					class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
				>{data.user.bio ?? ""}</textarea>
				<p class="mt-1 text-xs text-gray-400">Max 500 characters</p>
			</div>

			<div class="flex items-center gap-3">
				<button
					type="submit"
					class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
				>
					Save Profile
				</button>
				{#if form?.profileSuccess}
					<span class="text-sm text-green-600">{form.profileSuccess}</span>
				{:else if form?.profileError}
					<span class="text-sm text-red-600">{form.profileError}</span>
				{/if}
			</div>
		</form>
	</section>

	<!-- Password Section -->
	<section class="rounded-lg border border-gray-200 bg-white p-6">
		<h2 class="mb-6 text-lg font-semibold">Change Password</h2>
		<form method="POST" action="?/changePassword" use:enhance class="space-y-4">
			<div>
				<label for="currentPassword" class="mb-1 block text-sm font-medium text-gray-700">
					Current Password
				</label>
				<input
					type="password"
					id="currentPassword"
					name="currentPassword"
					required
					autocomplete="current-password"
					class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
				/>
			</div>

			<div>
				<label for="newPassword" class="mb-1 block text-sm font-medium text-gray-700">
					New Password
				</label>
				<input
					type="password"
					id="newPassword"
					name="newPassword"
					required
					minlength="8"
					autocomplete="new-password"
					class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
				/>
				<p class="mt-1 text-xs text-gray-400">At least 8 characters</p>
			</div>

			<div>
				<label for="confirmPassword" class="mb-1 block text-sm font-medium text-gray-700">
					Confirm New Password
				</label>
				<input
					type="password"
					id="confirmPassword"
					name="confirmPassword"
					required
					minlength="8"
					autocomplete="new-password"
					class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
				/>
			</div>

			<div class="flex items-center gap-3">
				<button
					type="submit"
					class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
				>
					Change Password
				</button>
				{#if form?.passwordSuccess}
					<span class="text-sm text-green-600">{form.passwordSuccess}</span>
				{:else if form?.passwordError}
					<span class="text-sm text-red-600">{form.passwordError}</span>
				{/if}
			</div>
		</form>
	</section>
</div>
