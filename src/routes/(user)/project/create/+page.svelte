<script lang="ts">
  import { goto } from "$app/navigation";
  import { createProject } from "./createProject.remote";

  let name = $state("");

  let error = $state("");

  let doingCreate = false;
  const doCreate = async () => {
    if (doingCreate) {
      return;
    }
    doingCreate = true;

    let newProjectId;
    try {
      newProjectId = await createProject({ name });
    } catch {
      doingCreate = false;
      error = "Something went wrong";
      return;
    }

    doingCreate = false;
    goto(`/project/${newProjectId}`);
  };
</script>

<div class="grid grid-cols-[10rem_auto]">
  <h1 class="col-span-2 text-lg font-bold">Create a new project</h1>

  {#if error}
    <span class="col-span-2 text-red-500">
      Error: {error}
    </span>
  {/if}

  <label for="name">Project name</label>
  <input
    id="name"
    type="text"
    bind:value={name}
    onchange={() => {
      error = "";
    }} />

  <button type="submit" onclick={doCreate}> Create Project </button>
</div>
