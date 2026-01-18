<script lang="ts">
  import { Project } from "$com";
  import { getProject } from "$lib/remote";
  import type { PageData } from "./$types";

  const {
    data,
  }: {
    data: PageData;
  } = $props();

  const session = $derived(data.session);
  const activeProject = $derived(
    data.activeProjectId ? await getProject(data.activeProjectId) : null,
  );
</script>

{#if !session}
  <!-- User isn't logged in -->
  <div class="flex h-full w-full flex-col items-center justify-center gap-2">
    <h1 class="text-xl font-bold">Welcome to Harrsoft Kanban</h1>
    <p>Please login to continue</p>
  </div>
{:else}
  <div class="flex h-full w-full flex-col gap-2">
    {#if activeProject}
      <h1 class="text-xl font-bold">Active Project</h1>
      <Project project={activeProject} />
    {:else}
      <h1 class="text-xl font-bold">No Active Project</h1>
    {/if}
  </div>
{/if}
