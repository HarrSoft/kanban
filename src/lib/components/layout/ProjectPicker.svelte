<script lang="ts">
  import { page } from "$app/state";
  import pickProject from "./pickProject.remote";

  let projectId = $state(page.data.activeProject);
</script>

<div class="flex items-center">
  <label for="project-picker"> Project: </label>

  <select
    id="project-picker"
    bind:value={projectId}
    onchange={() => pickProject({ projectId })}>
    <option value={null}>-- Select a project --</option>
    {#each page.data.projects as project}
      <option value={project.id} class="flex items-center">
        {project.name}
      </option>
    {/each}
  </select>
</div>
