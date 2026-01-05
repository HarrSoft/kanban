<script lang="ts">
  import type { Snippet } from "svelte";
  import { Nav } from "$com/layout";
  import type { LayoutData } from "./$types";

  const {
    children,
    //data,
  }: {
    children?: Snippet;
    data: LayoutData;
  } = $props();
</script>

<div class={["flex h-full w-full flex-col", "lg:flex-row"]}>
  <Nav
    tabs={[
      { path: "/admin/projects", name: "Projects" },
      { path: "/admin/users", name: "Users" },
    ]} />
  <div class="h-full w-full overflow-y-auto p-4">
    {@render children?.()}
  </div>
</div>
