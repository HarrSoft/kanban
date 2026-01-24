<script module>
  export interface NavTab {
    path: string;
    name: string;
  }
</script>

<script lang="ts">
  import type { ClassValue } from "svelte/elements";
  import { page } from "$app/state";
  import { getSession, logout } from "$lib/remote";

  const {
    className,
    open = $bindable(false),
    tabs,
  }: {
    className?: ClassValue;
    open?: boolean;
    tabs: NavTab[];
  } = $props();

  const session = $derived(await getSession());
</script>

<nav
  class={[
    "w-full lg:w-50",
    open ? "h-auto" : "h-0 overflow-y-hidden",
    "lg:h-full lg:overflow-y-auto",
    "flex flex-col",
    "border-b-2 border-shadow lg:border-r-2 lg:border-b-0",
    className,
  ]}
>
  {#each tabs as tab}
    <a
      href={tab.path}
      class={[
        "w-full px-4 py-2 text-center",
        page.url.pathname === tab.path ?
          "bg-print font-bold text-invert"
        : "hover:bg-content",
      ]}
    >
      {@html tab.name}
    </a>
  {/each}
  <form
    {...logout}
    class={[
      "w-full cursor-pointer px-4 py-2 text-center hover:bg-content",
      session ? "visible" : "hidden",
    ]}
  >
    <button type="submit" class="h-full w-full cursor-pointer">Logout</button>
  </form>
</nav>
