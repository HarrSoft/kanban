<script lang="ts">
  import { ProjectFull } from "$types";

  const {
    project,
  }: {
    project: ProjectFull;
  } = $props();
</script>

<div class="flex flex-col gap-2">
  <!-- Project name and icon -->
  <div class="flex items-center gap-2">
    {#if project.imageUrl}
      <img src={project.imageUrl} alt="Project Icon" class="h-15 w-15" />
    {:else}
      <span class="p-auto text-2x h-15 w-15">🎁</span>
    {/if}
    <h1 class="text-xl font-bold">{project.name}</h1>
  </div>

  <!-- Project members -->
</div>
