<script lang="ts">
  import { type Snippet } from "svelte";
  import { Header, Nav, Themer } from "$com/layout";
  import favicon from "$lib/assets/harrsoft_border.svg";
  //import { Theme } from "$types";
  import type { LayoutData } from "./$types";
  import "../app.css";

  let {
    children,
    //data,
  }: {
    children?: Snippet;
    data: LayoutData;
  } = $props();

  //const theme: Theme = $derived(data.session?.theme || "auto");
  const theme = "oceanside";
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <Themer {theme} />
</svelte:head>

<div class="flex h-full w-full flex-col">
  <Header />

  <div class={["flex h-full w-full flex-col", "lg:flex-row"]}>
    <Nav />
    <div class="h-full w-full overflow-y-auto p-4">
      {@render children?.()}
    </div>
  </div>
</div>
