<script lang="ts">
  import { Chevron } from "$com/icons";
  import {
    getActiveProject,
    getProject,
    getProjects,
    pickProject,
  } from "$lib/remote";
  import { ProjectInfo } from "$types";

  const apid = $derived(await getActiveProject());
  const activeProject = $derived(apid ? await getProject(apid) : null);
</script>

<form {...pickProject} class="relative h-[3rem] w-55">
  <ul
    class={[
      "rounded-lg border bg-base",
      "h-[3rem] has-[:focus]:h-auto",
      "overflow-y-hidden has-[:focus]:overflow-y-auto",
      "absolute top-0 left-0 w-max",
    ]}
  >
    <li>
      <button
        form=""
        tabindex="0"
        class={[
          "h-[2.8rem] w-full px-4 py-2",
          "flex items-center justify-between gap-4",
          "group cursor-pointer",
        ]}
      >
        {#if activeProject}
          {@render projectInfo(activeProject)}
        {:else}
          <span>-- Pick a Project --</span>
        {/if}

        <Chevron className="group-focus:rotate-180" />
      </button>
    </li>

    {#each await getProjects() as project}
      <li>
        <button
          {...pickProject.fields.projectId.as("submit", project.id)}
          class={[
            "h-[2.8rem] w-full px-4 py-2",
            "flex items-center justify-between",
            "cursor-pointer hover:bg-shadow",
          ]}
        >
          {@render projectInfo(project)}
        </button>
      </li>
    {:else}
      <li
        class={[
          "w-full h-[2.8rem] px-4 py-2",
          "flex items-center justify-between",
          "cursor-pointer hover:bg-shadow",
        ]}
      >
        -- No Projects --
      </li>
    {/each}
  </ul>
</form>

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
