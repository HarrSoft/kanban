<script lang="ts">
  import { ProjectInfo } from "$com/projects";
  import { EditIcon, TrashIcon } from "$com/icons";
  import { Button } from "$com/widgets";
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
    <Button href="/admin/projects/create">+ Create new project</Button>
  </div>

  <div class="grid grid-cols-4 items-center">
    {#each data.allProjects as project}
      <span>[ ]</span>

      <ProjectInfo {project} name link />

      <Button>
        <EditIcon className="text-invert" />
      </Button>

      <Button>
        <TrashIcon className="text-red-500" />
      </Button>
    {/each}
  </div>
</div>
