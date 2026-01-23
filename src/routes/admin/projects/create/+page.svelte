<script lang="ts">
  import { createProject } from "$lib/remote";
</script>

<form {...createProject} class="flex flex-col gap-2">
  <h1 class="text-lg font-bold">Create a new project</h1>

  <label>
    <h2>Project Name</h2>
    <input {...createProject.fields.name.as("text")} />
    {#each createProject.fields.name.issues() || [] as issue}
      <span class="text-red-500">{issue.message}</span>
    {/each}
  </label>

  <button class="button solid w-fit">Create Project</button>
</form>
