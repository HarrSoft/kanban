<script lang="ts">
  import type { ClassValue } from "svelte/elements";

  const {
    className,
  }: {
    className?: ClassValue;
  } = $props();
</script>

<svg
  fill="currentColor"
  viewBox="0 0 16 20"
  xmlns="http://www.w3.org/2000/svg"
  class={className}
>
  <path d="M0 0L16 10L0 20L0 0Z" />
</svg>
