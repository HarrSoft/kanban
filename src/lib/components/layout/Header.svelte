<script lang="ts">
  import type { ClassValue } from "svelte/elements";
  import { Logo } from "$com";

  let {
    className,
  }: {
    className?: ClassValue;
  } = $props();
</script>

<header
  class={[
    "flex items-center gap-2 border-shadow p-2 lg:border-b-2",
    className,
  ]}>
  <Logo />
  <h1 class="text-3xl font-bold">Harrsoft Kanban</h1>
</header>
