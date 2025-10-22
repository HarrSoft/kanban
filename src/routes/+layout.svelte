<script lang="ts">
  import { type Snippet } from "svelte";
  import { Header, Nav } from "$com/layout";
  import favicon from "$lib/assets/harrsoft_border.svg";

  let {
    children
  }: {
    children?: Snippet;
  } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div class={[
  "flex flex-col w-full h-full",
  "bg-white text-black",
  "dark:bg-blue-50 dark:text-white",
]}>
  <Header />

  <div class={[
    "flex flex-col w-full h-full",
    "lg:flex-row",
  ]}>
    <Nav className={[
      "w-full overflow-x-auto",
      "lg:w-auto lg:h-full",
      "bg-slate-900",
      "dark:bg-slate-100"
    ]} />
    <div class="w-full h-full overflow-y-auto">
      {@render children?.()}
    </div>
  </div>
</div>

<style>
</style>
