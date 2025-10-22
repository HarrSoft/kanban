<script lang="ts">
  import type { ClassValue } from "svelte/elements";
  import { page } from "$app/state";

  const {
    className,
  }: {
    className? :ClassValue;
  } = $props();

  const tabs = ["projects", "time", "kanban"] as const;
  type Tab = typeof tabs[number];
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
    "flex flex-col md:flex-row p-4 gap-4",
    "border-r-2 md:border-r-0 md:border-b-2",
    className,
  ]}>
  <a
    href="/"
    class={[
      "border-2 rounded-lg p-2",
      tab === "projects" ?
        "border-4 font-bold"
      : "",
    ]}>
    Projects
  </a>
  <a
    href="/time"
    class={[
      "border-2 rounded-lg p-2",
      tab === "time" ?
        "border-4 font-bold"
      : "",
    ]}>
    Time Clock
  </a>
  <a
    href="/kanban"
    class={[
      "border-2 rounded-lg p-2",
      tab === "kanban" ?
        "border-4 font-bold"
      : "",
    ]}>
    Kanban
  </a>
</nav>
