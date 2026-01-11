<script lang="ts">
  import type { Snippet } from "svelte";
  import { Nav } from "$com/layout";
  import type { LayoutData } from "./$types";

  const {
    children,
    data,
  }: {
    children?: Snippet;
    data: LayoutData;
  } = $props();

  const isAdmin = $derived(data.session?.platformRole === "admin");
</script>

<div class={["flex h-full w-full flex-col", "lg:flex-row"]}>
  <Nav
    tabs={[
      { path: "/project", name: "Project" },
      { path: "/time", name: "Time&nbsp;Clock" },
      { path: "/tasks", name: "Tasks" },
      { path: "/settings", name: "Settings" },
      isAdmin ? { path: "/admin", name: "Admin Dashboard" } : [],
    ].flat()} />
  <div class="h-full w-full overflow-y-auto p-4">
    {@render children?.()}
  </div>
</div>
