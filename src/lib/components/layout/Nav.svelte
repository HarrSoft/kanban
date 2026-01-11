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
    "grid grid-cols-1 items-center overflow-y-hidden lg:overflow-y-scroll",
    open ? "h-auto" : "h-0",
    "lg:h-auto lg:w-auto",
    "border-b-2 border-shadow lg:border-r-2 lg:border-b-0",
    className,
  ]}
>
  {#each tabs as tab}
    <a
      href={tab.path}
      class="px-4 py-2 text-center hover:bg-alt hover:text-invert"
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
