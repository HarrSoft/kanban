<script lang="ts">
  import type { Snippet } from "svelte";
  import type {
    ClassValue,
    HTMLAnchorAttributes,
    HTMLButtonAttributes,
  } from "svelte/elements";
  import { goto } from "$app/navigation";
  import { default as Spinner } from "./Spinner.svelte";

  const themes = {
    solid: {
      base: [
        "rounded-lg font-semibold text-invert px-6 py-2 inline-flex",
        "border-2 justify-center items-center text-center no-underline",
        "transition-colors duration-200",
      ],
      enabled: [
        "border-hilight bg-hilight",
        "hover:border-hilight/80 hover:bg-hilight/80",
      ],
      disabled: ["border-shadow bg-shadow cursor-not-allowed"],
    },
    border: {
      base: [
        "rounded-lg font-semibold text-invert px-6 py-2 inline-flex",
        "border-2 justify-center items-center text-center no-underline",
        "transition-colors duration-200",
      ],
      enabled: ["border-hilight text-hilight hover:bg-hilight/20"],
      disabled: ["border-shadow text-shadow cursor-not-allowed"],
    },
    none: {
      base: [],
      enabled: [],
      disabled: [],
    },
  };

  const {
    children,
    className,
    disabled = false,
    href,
    onclick,
    spin = false,
    theme = "solid",
    ...rest
  }: {
    children?: Snippet;
    className?: ClassValue;
    disabled?: boolean;
    href?: HTMLAnchorAttributes["href"];
    onclick?: HTMLButtonAttributes["onclick"];
    spin?: boolean;
    theme?: keyof typeof themes;
  } & HTMLAnchorAttributes &
    HTMLButtonAttributes = $props();

  const finalClass: ClassValue = $derived(
    [
      themes[theme].base,
      disabled ? themes[theme].disabled : themes[theme].enabled,
      className,
    ].flat(),
  );
</script>

{#if onclick}
  <button
    onclick={async e => {
      await onclick(e);
      if (href) await goto(href);
    }}
    class={finalClass}
    disabled={disabled || spin}
    {...rest}
  >
    {@render children?.()}
    <Spinner show={spin} />
  </button>
{:else if href}
  <a {href} class={finalClass} {...rest}>
    {@render children?.()}
    <Spinner show={spin} />
  </a>
{:else}
  <span class={finalClass}>
    {@render children?.()}
    <Spinner show={spin} />
  </span>
{/if}
