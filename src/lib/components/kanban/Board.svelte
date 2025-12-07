<script lang="ts">
  import { dndzone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import Column from './Column.svelte';
  import { enhance } from '$app/forms';

  export let board: any;

  const flipDurationMs = 200;

  function handleDndConsiderColumns(e: CustomEvent<DndEvent<any>>) {
    board.columns = e.detail.items;
  }

  function handleDndFinalizeColumns(e: CustomEvent<DndEvent<any>>) {
    board.columns = e.detail.items;
    
    // Persist column order
    const data = new FormData();
    data.append('items', JSON.stringify(board.columns.map((c, i) => ({ id: c.id, order: i }))));
    
    fetch('?/updateColumnOrder', {
        method: 'POST',
        body: data
    });
  }

  function handleCardDrop(columnId: string, items: any[]) {
      // Find the column and update its cards locally (already done in Column.svelte bind, but good to be explicit if needed)
      // Persist card order/move
      const data = new FormData();
      data.append('columnId', columnId);
      data.append('items', JSON.stringify(items.map((c, i) => ({ id: c.id, order: i }))));

      fetch('?/updateCardOrder', {
          method: 'POST',
          body: data
      });
  }

  function handleDeleteCard(cardId: string) {
      const data = new FormData();
      data.append('cardId', cardId);
      fetch('?/deleteCard', { method: 'POST', body: data }).then(() => {
          // Optimistic update or reload could happen here, but SvelteKit's enhance on forms is better. 
          // Since this is a direct fetch, we might want to invalidateAll() or just let the user refresh for now if we don't want complex optimistic UI.
          // Actually, let's use a form for delete in the Card/Column component to leverage use:enhance, 
          // but for now I passed a callback. Let's just reload for simplicity or rely on reactivity if we were using a store.
          // Given the props structure, a full page reload or invalidate is safest.
          window.location.reload(); 
      });
  }
  
  function handleDeleteColumn(columnId: string) {
      if(!confirm('Are you sure you want to delete this column and all its cards?')) return;
      
      const data = new FormData();
      data.append('columnId', columnId);
      fetch('?/deleteColumn', { method: 'POST', body: data }).then(() => {
          window.location.reload();
      });
  }

  let isAddingColumn = false;
  let newColumnName = '';
</script>

<div class="h-full flex flex-col">
  <div class="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
    <h1 class="text-xl font-bold text-gray-800">{board.name}</h1>
    
    <!-- Add Column Form -->
    {#if isAddingColumn}
      <form 
        method="POST" 
        action="?/createColumn" 
        use:enhance={() => {
            return async ({ update }) => {
                await update();
                isAddingColumn = false;
                newColumnName = '';
            };
        }}
        class="flex gap-2"
      >
        <input 
          type="text" 
          name="name" 
          bind:value={newColumnName}
          placeholder="Column Name" 
          class="border rounded px-2 py-1 text-sm"
          autoFocus
        />
        <button type="submit" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Save</button>
        <button type="button" class="text-gray-500 text-sm" on:click={() => isAddingColumn = false}>Cancel</button>
      </form>
    {:else}
      <button 
        class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm font-medium transition-colors"
        on:click={() => isAddingColumn = true}
      >
        + Add Column
      </button>
    {/if}
  </div>

  <div 
    class="flex-1 overflow-x-auto overflow-y-hidden p-4 whitespace-nowrap flex items-start"
    use:dndzone={{items: board.columns, flipDurationMs, type: 'column'}}
    on:consider={handleDndConsiderColumns}
    on:finalize={handleDndFinalizeColumns}
  >
    {#each board.columns as column (column.id)}
      <div class="h-full inline-block align-top" animate:flip={{duration: flipDurationMs}}>
        <Column 
            {column} 
            onDrop={handleCardDrop} 
            onDeleteCard={handleDeleteCard}
            onDeleteColumn={handleDeleteColumn}
        />
      </div>
    {/each}
  </div>
</div>
