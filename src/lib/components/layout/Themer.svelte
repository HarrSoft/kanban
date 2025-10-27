<script lang="ts">
  import { Theme } from "$types";

  const { theme }: { theme: Theme } = $props();
</script>

{#if theme === "burning-love"}
  <style>
    :root {
      --main: #1c1f33;
      --shadow: #666370;
      --alt: #9b7874;
      --hilight: #d33e43;
      --print: #ff220c;
      --invert: #00ddf3;
    }
  </style>
{:else if theme === "oceanside"}
  <style>
    :root {
      --main: #d8dbe2;
      --shadow: #a9bcd0;
      --alt: #58a4b0;
      --hilight: #daa49a;
      --print: #373f51;
      --invert: #c8c0ae;
    }
  </style>
{:else if theme === "ribbit-dark"}
  <style>
    :root {
      --main: #34403a;
      --shadow: #285238;
      --alt: #138a36;
      --hilight: #04e824;
      --print: #18ff6d;
      --invert: #e70092;
    }
  </style>
{:else if theme === "ribbit-light"}
  <style>
    :root {
      --main: #18ff6d;
      --shadow: #04e824;
      --alt: #138a36;
      --hilight: #285238;
      --print: #34403a;
      --invert: #cbbfc5;
    }
  </style>
{:else if theme === "auto"}
  <style>
    :root {
      /* default light mode: oceanside */
      --main: #d8dbe2;
      --shadow: #a9bcd0;
      --alt: #58a4b0;
      --hilight: #daa49a;
      --print: #373f51;
      --invert: #c8c0ae;
    }

    @media (prefers-color-scheme: dark) {
      :root {
        /* default dark mode: burning-love */
        --main: #1c1f33;
        --shadow: #666370;
        --alt: #9b7874;
        --hilight: #d33e43;
        --print: #ff220c;
        --invert: #00ddf3;
      }
    }
  </style>
{/if}
