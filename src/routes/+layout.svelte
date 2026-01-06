<script lang="ts">
  import { type Snippet } from "svelte";
  import { Logo } from "$com";
  import { AuthWidget, ProjectPicker, Themer } from "$com/layout";
  import favicon from "$lib/assets/harrsoft_border.svg";
  import { Theme } from "$types";
  import type { LayoutData } from "./$types";
  import "../app.css";

  let {
    children,
    data,
  }: {
    children?: Snippet;
    data: LayoutData;
  } = $props();

  const theme: Theme = $derived(data.session?.theme || "auto");
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <Themer {theme} />
</svelte:head>

<div class="flex h-full w-full flex-col">
  <header
    class={[
      "w-full border-b-2 border-shadow",
      "flex items-center justify-between p-2",
    ]}>
    <!-- Left side -->
    <div class="flex items-center gap-2">
      <Logo />
      <span class="text-3xl font-bold">Harrsoft Kanban</span>
    </div>

    <!-- Right side -->
    <div class="flex items-center gap-2">
      {#if data.session}
        <ProjectPicker />
      {/if}
      <AuthWidget />
    </div>
  </header>

  {@render children?.()}
</div>
