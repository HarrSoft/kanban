<script lang="ts">
  import type { ClassValue } from "svelte/elements";
  import { page } from "$app/state";

  const {
    className,
    tabs,
  }: {
    className?: ClassValue;
    tabs: Array<{ path: string; name: string }>;
  } = $props();
</script>

<nav
  class={[
    "flex border-shadow",
    "h-auto w-full flex-row border-b-2",
    "lg:h-full lg:w-auto lg:flex-col lg:border-r-2 lg:border-b-0",
    "[&>a]:px-4 [&>a]:py-2 [&>a]:hover:bg-alt [&>a]:hover:text-invert",
    className,
  ]}>
  {#each tabs as tab}
    <a href={tab.path} class:selected={page.url.pathname === tab.path}>
      {@html tab.name}
    </a>
  {/each}
</nav>

<style>
  .selected {
    background-color: var(--shadow);
    color: var(--invert);
    font-weight: bold;
  }

  .selected:hover {
    background-color: var(--alt);
  }
</style>
