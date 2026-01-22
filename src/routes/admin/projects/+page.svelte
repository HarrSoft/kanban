<script lang="ts">
  import { Project } from "$com";
  import { EditIcon, TrashIcon } from "$com/icons";
  import { getAllProjects } from "$lib/remote";

  const allProjects = await getAllProjects();
</script>

<div class="flex flex-col gap-2">
  <div class="flex w-full items-center justify-between">
    <h1 class="text-2x font-bold">All Projects</h1>
    <a href="/admin/projects/create" class="button solid">
      + Create new project
    </a>
  </div>

  <div class="grid grid-cols-4 items-center">
    {#each allProjects as project}
      <span>[ ]</span>

      <Project {project} name link />

      <button>
        <EditIcon className="text-invert" />
      </button>

      <button>
        <TrashIcon className="text-red-500" />
      </button>
    {/each}
  </div>
</div>
