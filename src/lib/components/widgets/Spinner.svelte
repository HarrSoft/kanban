<script lang="ts">
  import type { ClassValue } from "svelte/elements";

  const {
    className,
    delayMs = 500,
    show,
  }: {
    className?: ClassValue;
    delayMs?: number;
    show: boolean;
  } = $props();

  let timer: ReturnType<typeof setTimeout> | undefined;
  let showInternal = $state(false);

  $effect(() => {
    if (show) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        showInternal = true;
      }, delayMs);
    } else {
      clearTimeout(timer);
      timer = undefined;
      showInternal = false;
    }
  });
</script>

{#if showInternal}
  <div
    class={[
      "h-5 w-5 animate-spin rounded-full",
      "border-t-hilight border-4 border-gray-300",
      className,
    ]}
  ></div>
{/if}
