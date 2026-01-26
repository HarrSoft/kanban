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
  viewBox="0 0 13 16"
  xmlns="http://www.w3.org/2000/svg"
  class={className}
>
  <path d="M0 0 V16 H5 V0 Z" />
  <path d="M8 0 V16 H13 V0 Z" />
</svg>
