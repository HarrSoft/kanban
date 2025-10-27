<script lang="ts">
  import type { ClassValue } from "svelte/elements";
  import { page } from "$app/state";

  const {
    className,
  }: {
    className?: ClassValue;
  } = $props();

  const tabs = ["projects", "time", "kanban", "settings"] as const;
  type Tab = (typeof tabs)[number];
  const tab: Tab | null = $derived.by(() => {
    const [_root, tab] = page.url.pathname.split("/");
    if (tabs.includes(tab as any)) {
      return tab as Tab;
    } else {
      return "projects";
    }
  });
</script>

<nav
  class={[
    "flex border-shadow",
    "h-auto w-full flex-row border-b-2",
    "lg:h-full lg:w-auto lg:flex-col lg:border-r-2 lg:border-b-0",
    "[&>a]:px-4 [&>a]:py-2 [&>a]:hover:bg-alt [&>a]:hover:text-invert",
    className,
  ]}>
  <a href="/" class:selected={tab === "projects"}> Projects </a>
  <a href="/time" class:selected={tab === "time"}> Time&nbsp;Clock </a>
  <a href="/kanban" class:selected={tab === "kanban"}> Kanban </a>
  <a href="/settings" class:selected={tab === "settings"}> Settings </a>
</nav>

<style>
  .selected {
    background-color: var(--shadow);
    font-weight: bold;
  }

  .selected:hover {
    background-color: var(--alt);
    color: var(--invert);
  }
</style>
