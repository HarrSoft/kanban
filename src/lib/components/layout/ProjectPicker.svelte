<script lang="ts">
  import { Chevron } from "$com/icons";
  import { getActiveProject, getProjects, pickProject } from "$lib/remote";
  import { ProjectInfo } from "$types";

  const activeProject = $derived(await getActiveProject());

  // component works with pure css, but this code makes ux better
  let justFocused = false;
</script>

<div class="group relative w-55 max-w-70 **:cursor-pointer">
  <button
    class={[
      "w-full border bg-base p-2",
      "flex items-center justify-between gap-2",
      "rounded-lg group-focus-within:rounded-b-none",
    ]}
    onfocus={() => (justFocused = true)}
    onblur={() => (justFocused = false)}
    onclick={e => {
      if (justFocused) {
        justFocused = false;
      } else {
        e.currentTarget.blur();
      }
    }}
  >
    {#if activeProject}
      {@render projectInfo(activeProject)}
    {:else}
      <span class="mx-auto">-- Pick a Project --</span>
    {/if}

    <Chevron className="group-focus-within:rotate-180" />
  </button>

  <form
    {...pickProject}
    class={[
      "absolute w-full rounded-lg rounded-t-none bg-base",
      "h-0 max-h-100 group-focus-within:h-auto",
      "border-0 group-focus-within:border group-focus-within:border-t-0",
      "overflow-y-hidden group-focus-within:overflow-y-auto",
    ]}
  >
    {#each await getProjects() as project}
      <button
        {...pickProject.fields.projectId.as("submit", project.id)}
        class="w-full p-2 hover:bg-shadow"
        onclick={e => e.currentTarget.blur()}
      >
        {@render projectInfo(project)}
      </button>
    {:else}
      <div class="w-full p-2 text-center">-- No Projects --</div>
    {/each}
  </form>
</div>

{#snippet projectInfo(project: ProjectInfo)}
  <div class="flex items-center gap-2">
    {#if project.imageUrl}
      <img src={project.imageUrl} alt="icon" class="w-[2rem]" />
    {:else}
      <span class="w-[2rem]">🎁</span>
    {/if}

    <span>{project.name}</span>
  </div>
{/snippet}
