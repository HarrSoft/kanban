<script lang="ts">
  import type { ClassValue } from "svelte/elements";

  const {
    border = false,
    className,
  }: {
    border?: boolean;
    className?: ClassValue;
  } = $props();
</script>

<svg
  width="218.18mm"
  height="218.18mm"
  version="1.1"
  viewBox="0 0 218.18 218.18"
  xmlns="http://www.w3.org/2000/svg"
  class={className}>
  <g transform="translate(-3.4083 -10.908)">
    {#if border}
      <g>
        <path
          fill="#fff"
          d="m112.5 92.018 27.982 27.982-27.982 27.982-27.982-27.982z" />
        <path
          fill="none"
          stroke="#fff"
          stroke-width="33.5"
          d={[
            "m112.5 60 37.5-22.5 7.5 37.5 37.5 7.5-22.5 37.5 22.5 37.5-37.5 7.5-7.",
            "5 37.5-37.5-22.5-37.5 22.5-7.5-37.5-37.5-7.5 22.5-37.5-22.5-37.5 37.5",
            "-7.5 7.5-37.5z",
          ].join("")} />
      </g>
    {/if}
    <g>
      <path
        fill="#000"
        stroke="none"
        d="m112.5 97.5 22.5 22.5-22.5 22.5-22.5-22.5z" />
      <path
        fill="none"
        stroke="#000"
        stroke-width="25.065"
        d={[
          "m112.5 60 37.5-22.5 7.5 37.5 37.5 7.5-22.5 37.5 22.5 37.5-37.5 7.5-",
          "7.5 37.5-37.5-22.5-37.5 22.5-7.5-37.5-37.5-7.5 22.5-37.5-22.5-37.5 ",
          "37.5-7.5 7.5-37.5z",
        ].join("")} />
    </g>
  </g>
</svg>
