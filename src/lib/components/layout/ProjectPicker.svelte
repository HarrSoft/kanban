<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { pickProject } from "$lib/remote";
  import { ProjectId } from "$types";

  let projectId = $state(page.data.activeProject);

  // CUID2 will never produce an id containing a !
  const NEW_PROJECT_SYM = "!NEW!" as ProjectId;

  const pick = () => {
    if (projectId === NEW_PROJECT_SYM) {
      return goto("/project/create");
    } else {
      return pickProject({ projectId });
    }
  };
</script>

<select bind:value={projectId} onchange={pick}>
  <option value={null}>-- Select a project --</option>
  {#each page.data.projects as project}
    <option value={project.id} class="flex items-center">
      {project.name}
    </option>
  {/each}
  {#if page.data.session && page.data.session.platformRole !== "viewer"}
    <option value={NEW_PROJECT_SYM}>+ Create new project</option>
  {/if}
</select>
