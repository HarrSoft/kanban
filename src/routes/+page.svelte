<script lang="ts">
  import { ProjectOverview } from "$com/projects";
  import type { PageData } from "./$types";

  const {
    data,
  }: {
    data: PageData;
  } = $props();
</script>

{#if !data.session}
  <!-- User isn't logged in -->
  <div class="flex h-full w-full flex-col items-center justify-center gap-2">
    <h1 class="text-xl font-bold">Welcome to Harrsoft Kanban</h1>
    <p>Please login to continue</p>
  </div>
{:else}
  <div class="flex h-full w-full flex-col gap-2">
    {#if data.activeProject}
      <h1 class="text-xl font-bold">Active Project</h1>
      <ProjectOverview project={data.activeProject} />
    {:else}
      <h1 class="text-xl font-bold">No Active Project</h1>
    {/if}
  </div>
{/if}
