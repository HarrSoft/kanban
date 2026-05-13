<script lang="ts">
	import type { ClassValue } from "svelte/elements";

	let {
		className,
	}: {
		className?: ClassValue;
	} = $props();
</script>

<header
	class={["flex items-center gap-2 border-shadow p-2 lg:border-b-2", className]}
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		class="h-8 w-8 text-blue-600"
		fill="none"
		viewBox="0 0 24 24"
		stroke="currentColor"
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
		/>
	</svg>
	<h1 class="text-3xl font-bold">Harrsoft Kanban</h1>
</header>
