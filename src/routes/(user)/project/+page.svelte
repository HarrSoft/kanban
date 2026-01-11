<script lang="ts">
  import type { PageData } from "./$types";

  const {
    data,
  }: {
    data: PageData;
  } = $props();

  const project = $derived(
    data.projects.find(p => p.id === data.activeProject),
  );
</script>

<div class="scroll-y-auto flex flex-col p-2">
  {#if project}
    <!-- Project title & info -->
    <div class="grid grid-cols-2 gap-2">
      {#if project.imageUrl}
        <img src={project.imageUrl} alt="Project logo" class="h-20 w-20" />
      {:else}
        <span class="text-lg">🎁</span>
      {/if}
      <span class="text-lg font-bold">{project.name}</span>
    </div>

    <!-- Project members -->
    <div class="grid grid-cols-4"></div>
  {:else}
    <span class="m-2 text-lg"
      >Create a project or ask to join one to continue</span>
  {/if}
</div>
