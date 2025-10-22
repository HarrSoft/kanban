<script lang="ts">
  import { type Snippet } from "svelte";
  import { Header, Nav, Themer } from "$com/layout";
  import favicon from "$lib/assets/harrsoft_border.svg";
  import "$styles/reset.css";
  import { Theme } from "$types";
  import type { LayoutData } from "./$types";

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
</svelte:head>

<Themer {theme} />

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
