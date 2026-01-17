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
  viewBox="0 0 16 16"
  xmlns="http://www.w3.org/2000/svg"
  class={className}
>
  <path d="M7 1H2V15H7V1Z" />
  <path d="M14 1H9V15H14V1Z" />
</svg>
