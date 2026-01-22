<script lang="ts">
  import { goto } from "$app/navigation";
  import { createProject } from "$lib/remote";

  let name = $state("");

  let error = $state("");

  let doingCreate = $state(false);
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
    goto(`/projects/${newProjectId}`);
  };

  const formComplete = $derived(!!name);
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
    }}
  />

  <button
    type="submit"
    onclick={doCreate}
    disabled={!formComplete}
    class={["button solid", !formComplete ? "disabled" : []]}
  >
    Create Project
  </button>
</div>
