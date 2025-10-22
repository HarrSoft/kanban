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
    "flex p-4 gap-4",
    className,
  ]}>
  <Logo border />
  <h1>Harrsoft Kanban</h1>
</header>
