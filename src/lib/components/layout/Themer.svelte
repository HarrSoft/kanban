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
    }

    @media (prefers-color-scheme: dark) {
      :root {
        /* default dark mode: burning-love */
        --main: #1c1f33;
        --shadow: #666370;
        --alt: #9b7874;
        --hilight: #d33e43;
        --print: #ff220c;
        --invert: #550003;
      }
    }
  </style>
{/if}

<style>
  :root {
    background-color: var(--main);
    color: var(--print);
  }
</style>
