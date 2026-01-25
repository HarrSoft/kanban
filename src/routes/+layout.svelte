<script lang="ts">
  import { onMount, type Snippet } from "svelte";
  import { onNavigate } from "$app/navigation";
  import { page } from "$app/state";
  import { Logo } from "$com/icons";
  import { ProjectPicker, Nav, type NavTab } from "$com/layout";
  import favicon from "$lib/assets/harrsoft_border.svg";
  import burger from "$lib/assets/burger.png";
  import { getSession } from "$lib/remote";
  import "../app.css";

  let { children }: { children?: Snippet } = $props();

  const session = $derived(await getSession());

  let navOpen = $state(true);
  onMount(() => {
    navOpen = false;
  });
  onNavigate(() => {
    navOpen = false;
  });

  const onAdminPage = $derived(page.url.pathname.startsWith("/admin"));

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
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>Harrsoft Kanban</title>
</svelte:head>

<div class="flex h-full flex-col">
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
        onclick={() => (navOpen = !navOpen)}
        title="Hamburger Menu"
        class="!m-0 !rounded-none !bg-transparent !p-0 lg:hidden"
      >
        <img src={burger} alt="burger" class="h-15 w-15" />
      </button>
    </div>
  </header>

  <!-- Nav and content -->
  <div class="flex h-full w-full flex-col lg:flex-row">
    <Nav bind:open={navOpen} {tabs} />

    <div class="h-full w-full p-4">
      {@render children?.()}
    </div>
  </div>
</div>
