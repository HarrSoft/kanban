<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { ProjectPicker } from '$com';
	import { Logo } from '$com/icons';
	import favicon from '$lib/assets/harrsoft_border.svg';
	import burger from '$lib/assets/burger.png';
	import { getSession, logout } from '$lib/remote';
	import '../app.css';

	let { children }: { children?: Snippet } = $props();

	const session = $derived(await getSession());

	// Nav links defined here and iterated in HTML to be rendered in navLink snippet
	// All categories' links should be included in NavLinkPath type below
	const loginLink = ['Login', '/login'] as const;
	const userLinks = [
		['Dashboard', '/'],
		['Time Clock', '/time'],
		['Settings', '/settings'],
	] as const;
	const adminLinks = [
		['Admin Dashboard', '/admin'],
		['Projects', '/admin/projects'],
		['Users', '/admin/users'],
		['User Invites', '/admin/invites'],
		['User Dashboard', '/'],
	] as const;
	const adminDashLink = ['Admin Dashboard', '/admin'] as const;

	type NavLinkPath =
		| (typeof loginLink)[1]
		| (typeof userLinks)[number][1]
		| (typeof adminLinks)[number][1]
		| (typeof adminDashLink)[1];

	const onAdminPage = $derived(page.url.pathname.startsWith('/admin'));

	// component works with pure css, but js improves ux
	let burgJustFocused = false;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Harrsoft Kanban</title>
</svelte:head>

<div id="root" class="flex h-full flex-col">
	<header
		class={[
			'border-shadow w-full border-b-2',
			'flex items-center justify-between p-2',
		]}
	>
		<!-- Left side -->
		<div class="flex items-center gap-2">
			<Logo />
			<span class="text-3xl font-bold">Harrsoft Kanban</span>
		</div>

		<!-- Right side -->
		<div class="flex items-center gap-4">
			{#if session && !onAdminPage}
				<ProjectPicker />
			{/if}

			<button
				id="burger"
				tabindex="0"
				class="m-0 rounded-none bg-transparent p-0 lg:hidden"
				onfocus={() => (burgJustFocused = true)}
				onblur={() => (burgJustFocused = false)}
				onclick={(e) => {
					if (burgJustFocused) {
						burgJustFocused = false;
					} else {
						e.currentTarget.blur();
					}
				}}
			>
				<img src={burger} alt="burger" class="h-15 w-15" />
			</button>
		</div>
	</header>

	<!-- Nav and content -->
	<div class="flex h-full w-full flex-col lg:flex-row">
		<nav
			class={[
				'w-full lg:w-50',
				'h-0 overflow-y-hidden',
				'lg:h-full lg:overflow-y-auto',
				'flex flex-col',
				'border-shadow border-b-2 lg:border-r-2 lg:border-b-0',
			]}
		>
			{#if !session}
				<!-- Unauthenticated Tabs -->
				{@render navLink(loginLink[0], loginLink[1])}
			{:else if onAdminPage}
				<!-- Admin Tabs -->
				{#each adminLinks as tab (tab[0])}
					{@render navLink(tab[0], tab[1])}
				{/each}
			{:else}
				<!-- User Tabs -->
				{#each userLinks as tab (tab[0])}
					{@render navLink(tab[0], tab[1])}
				{/each}
				{#if session.platformRole === 'admin'}
					{@render navLink(adminDashLink[0], adminDashLink[1])}
				{/if}
			{/if}

			{#if session}
				<form {...logout}>
					<button class="hover:bg-content w-full px-4 py-2 text-center">
						Logout
					</button>
				</form>
			{/if}
		</nav>

		<div class="h-full w-full p-4">
			{@render children?.()}
		</div>
	</div>
</div>

{#snippet navLink(name: string, path: NavLinkPath)}
	<a
		href={resolve(path)}
		class={[
			'w-full px-4 py-2 text-center',
			page.url.pathname === path ?
				'bg-print text-invert font-bold'
			:	'hover:bg-content',
		]}
	>
		{name}
	</a>
{/snippet}

<style>
	#root:has(#burger:focus) nav {
		height: auto;
		overflow-y: visible;
	}

	nav:focus-within {
		height: auto;
		overflow-y: visible;
	}
</style>
