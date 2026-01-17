<script lang="ts">
  import { ProjectInfo } from "$types";

  const {
    project,
    name = true,
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
    <span class="flex h-15 w-15 items-center justify-center text-[2rem]">
      🎁
    </span>
  {/if}

  {#if name}
    <h1 class="text-2xl font-bold">{project.name}</h1>
  {/if}
{/snippet}
