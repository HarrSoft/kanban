<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { pickProject } from "$lib/remote";

  let projectId = $state(page.data.activeProject?.id || null);
</script>

<select bind:value={projectId} onchange={() => pickProject({ projectId })}>
  <option value={null}>-- Select a project --</option>
  {#each page.data.projects as project}
    <option value={project.id} class="flex items-center">
      {project.name}
    </option>
  {/each}
</select>
