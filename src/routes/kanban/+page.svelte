<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<div class="p-8">
  <h1 class="text-2xl font-bold mb-6">Projects & Boards</h1>

  {#if data.boards.length === 0}
    <p class="text-gray-500">No boards found. Run the seed script!</p>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each data.boards as board}
        <a 
          href="/kanban/{board.id}" 
          class="block p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 class="text-xl font-semibold text-gray-800 mb-2">{board.name}</h2>
          <p class="text-sm text-gray-500">Project ID: {board.projectId}</p>
        </a>
      {/each}
    </div>
  {/if}
</div>
