<script lang="ts">
  import type { ClassValue } from "svelte/elements";

  const {
    className,
  }: {
    className?: ClassValue;
  } = $props();
</script>

<svg
  class={["h-16 w-16", className]}
  version="1.1"
  viewBox="0 0 132 132"
  xmlns="http://www.w3.org/2000/svg"
  stroke="currentColor"
>
  <g transform="translate(14.038 16)" fill="none" stroke-width="10">
    <rect
      transform="rotate(-45)"
      x="-1.7829"
      y="68.928"
      width="6.3397"
      height="6.3397"
    />
    <path
      class="halo"
      d={[
        "m75.81 91.307-23.848-11.307-23.848 11.307-2.1323-26.307-21.716-15 2",
        "1.716-15 2.1323-26.307 23.848 11.307 23.848-11.307 2.1323 26.307 21",
        ".716 15-21.716 15z",
      ].join("")}
    />
  </g>
</svg>
