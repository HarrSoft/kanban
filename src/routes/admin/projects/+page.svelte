<script lang="ts">
  import { ProjectInfo } from "$com/projects";
  import { EditIcon, TrashIcon } from "$com/icons";
  import type { PageData } from "./$types";

  const {
    data,
  }: {
    data: PageData;
  } = $props();
</script>

<div class="flex flex-col gap-2">
  <div class="flex w-full items-center justify-between">
    <h1 class="text-2x font-bold">All Projects</h1>
    <a
      href="/admin/projects/create"
      class="rounded-lg bg-hilight px-4 py-2 font-bold text-invert"
    >
      + Create new project
    </a>
  </div>

  <div class="grid grid-cols-4 items-center">
    {#each data.allProjects as project}
      <span>[ ]</span>

      <ProjectInfo {project} name link />

      <button>
        <EditIcon className="text-invert" />
      </button>

      <button>
        <TrashIcon className="text-red-500" />
      </button>
    {/each}
  </div>
</div>
