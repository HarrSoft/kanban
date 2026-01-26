<script lang="ts">
  import { type Snippet } from "svelte";
  import { page } from "$app/state";
  import { ProjectPicker } from "$com";
  import { Logo } from "$com/icons";
  import favicon from "$lib/assets/harrsoft_border.svg";
  import burger from "$lib/assets/burger.png";
  import { getSession } from "$lib/remote";
  import "../app.css";

  let { children }: { children?: Snippet } = $props();

  const session = $derived(await getSession());

  const onAdminPage = $derived(page.url.pathname.startsWith("/admin"));

  interface NavTab {
    path: string;
    name: string;
  }
  const tabs: NavTab[] = $derived.by(() => {
    const isAdmin = session?.platformRole === "admin";
    if (!session) {
      // Anonymous tabs
      return [{ path: "/login", name: "Login" }];
    } else if (onAdminPage) {
      // Admin tabs
      return [
        { path: "/admin", name: "Admin&nbsp;Dashboard" },
        { path: "/admin/projects", name: "Projects" },
        { path: "/admin/users", name: "Users" },
        { path: "/admin/invites", name: "User&nbsp;Invites" },
        { path: "/", name: "User&nbsp;Dashboard" },
      ];
    } else {
      // User tabs
      return [
        { path: "/", name: "Dashboard" },
        { path: "/time", name: "Time&nbsp;Clock" },
        { path: "/settings", name: "Settings" },
        isAdmin ? { path: "/admin", name: "Admin&nbsp;Dashboard" } : [],
      ].flat();
    }
  });

  // component works with pure css, but js improves ux
  let burgJustFocused = false;
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>Harrsoft Kanban</title>
</svelte:head>

<div id="root" class="flex h-full flex-col">
  <header
    class={[
      "w-full border-b-2 border-shadow",
      "flex items-center justify-between p-2",
    ]}
  >
    <!-- Left side -->
    <div class="flex items-center gap-2">
      <Logo />
      <span class="text-3xl font-bold">Harrsoft Kanban</span>
    </div>

    <!-- Right side -->
    <div class="flex items-center gap-4">
      {#if session && !onAdminPage}
        <ProjectPicker />
      {/if}

      <button
        id="burger"
        tabindex="0"
        class="m-0 rounded-none bg-transparent p-0 lg:hidden"
        onfocus={() => (burgJustFocused = true)}
        onblur={() => (burgJustFocused = false)}
        onclick={e => {
          if (burgJustFocused) {
            burgJustFocused = false;
          } else {
            e.currentTarget.blur();
          }
        }}
      >
        <img src={burger} alt="burger" class="h-15 w-15" />
      </button>
    </div>
  </header>

  <!-- Nav and content -->
  <div class="flex h-full w-full flex-col lg:flex-row">
    <nav
      class={[
        "w-full lg:w-50",
        "h-0 overflow-y-hidden",
        "lg:h-full lg:overflow-y-auto",
        "flex flex-col",
        "border-b-2 border-shadow lg:border-r-2 lg:border-b-0",
      ]}
    >
      {#each tabs as tab}
        <a
          href={tab.path}
          class={[
            "w-full px-4 py-2 text-center",
            page.url.pathname === tab.path ?
              "bg-print font-bold text-invert"
            : "hover: bg-content",
          ]}
        >
          {@html tab.name}
        </a>
      {/each}
    </nav>

    <div class="h-full w-full p-4">
      {@render children?.()}
    </div>
  </div>
</div>

<style>
  #root:has(#burger:focus) nav {
    height: auto;
    overflow-y: visible;
  }

  nav:focus-within {
    height: auto;
    overflow-y: visible;
  }
</style>
