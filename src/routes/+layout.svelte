<script lang="ts">
  import { type Snippet } from "svelte";
  import { Logo } from "$com";
  import { Logout, Themer } from "$com/layout";
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
      "w-full border-shadow border-b-2",
      "flex items-center justify-between p-2",
    ]}
  >
    <div class="flex items-center gap-2">
      <Logo />
      <h1 class="text-3xl font-bold">Harrsoft Kanban</h1>
    </div>
    {#if data.session}
      <Logout />
    {/if}
  </header>

  {@render children?.()}
</div>
