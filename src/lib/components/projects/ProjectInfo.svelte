<script lang="ts">
  import { ProjectInfo } from "$types";

  const {
    project,
    name = false,
    link = false,
  }: {
    project: ProjectInfo;
    name?: boolean;
    link?: boolean;
  } = $props();
</script>

{#if link}
  <a href={`/projects/${project.id}`} class="flex items-center gap-2">
    {@render content()}
  </a>
{:else}
  <div class="flex items-center gap-2">
    {@render content()}
  </div>
{/if}

{#snippet content()}
  {#if project.imageUrl}
    <img src={project.imageUrl} alt="Project Icon" class="h-15 w-15" />
  {:else}
    <span class="p-auto text-2x h-15 w-15">🎁</span>
  {/if}

  {#if name}
    <h1 class="text-xl font-bold">{project.name}</h1>
  {/if}
{/snippet}
