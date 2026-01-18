<script module>
  export interface NavTab {
    path: string;
    name: string;
  }
</script>

<script lang="ts">
  import type { ClassValue } from "svelte/elements";
  import { page } from "$app/state";

  const {
    className,
    open = $bindable(false),
    tabs,
  }: {
    className?: ClassValue;
    open?: boolean;
    tabs: NavTab[];
  } = $props();
</script>

<nav
  class={[
    "w-full lg:w-50",
    open ? "h-auto" : "h-0 overflow-y-hidden",
    "lg:h-full lg:overflow-y-auto",
    "flex flex-col",
    "border-shadow border-b-2 lg:border-r-2 lg:border-b-0",
    className,
  ]}
>
  {#each tabs as tab}
    <a
      href={tab.path}
      class="hover:bg-alt hover:text-invert w-full px-4 py-2 text-center"
      class:selected={page.url.pathname === tab.path}
    >
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
