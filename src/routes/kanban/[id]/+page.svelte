<script lang="ts">
  import { browser } from '$app/environment';
  import type { PageData } from './$types';
  import { enhance } from '$app/forms';
  import { dndzone } from 'svelte-dnd-action';
  import QuillEditor from '$lib/components/QuillEditor.svelte';
  import type { CardId, ColumnId } from '$types/ids';

  export let data: PageData;

  let showNewColumnForm = false;
  let showNewCardForm: Record<string, boolean> = {};
  let quillEditors: Record<string, QuillEditor> = {};
  
  // Make columns and cards reactive for drag and drop
  $: columns = data.board.columns?.map(col => ({
    ...col,
    items: col.cards || []
  })) || [];

  const flipDurationMs = 200;

  function handleColumnDndConsider(e: CustomEvent, columnId: ColumnId) {
    const colIndex = columns.findIndex(c => c.id === columnId);
    if (colIndex !== -1) {
      columns[colIndex].items = e.detail.items;
    }
  }

  async function handleColumnDndFinalize(e: CustomEvent, columnId: ColumnId) {
    const colIndex = columns.findIndex(c => c.id === columnId);
    if (colIndex !== -1) {
      columns[colIndex].items = e.detail.items;
      
      // Update card order on server
      const formData = new FormData();
      formData.append('items', JSON.stringify(e.detail.items));
      formData.append('columnId', columnId);
      
      await fetch(`?/updateCardOrder`, {
        method: 'POST',
        body: formData
      });
    }
  }

  function toggleNewCardForm(columnId: string) {
    showNewCardForm[columnId] = !showNewCardForm[columnId];
  }

  async function handleCardSubmit(columnId: string) {
    const editor = quillEditors[columnId];
    if (!editor) return;

    const content = editor.getHTML();
    const trimmedContent = content.replace(/<p><br><\/p>/g, '').trim();
    
    // Check if content is empty or just whitespace
    if (!trimmedContent || trimmedContent === '<p></p>') {
      alert('Please enter some content for the card.');
      return;
    }

    const formData = new FormData();
    formData.append('content', content);
    formData.append('columnId', columnId);

    const response = await fetch('?/createCard', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      editor.clear();
      showNewCardForm[columnId] = false;
      window.location.reload();
    } else {
      alert('Failed to create card. Please try again.');
    }
  }

  async function deleteCard(cardId: CardId) {
    if (!confirm('Delete this card?')) return;

    const formData = new FormData();
    formData.append('cardId', cardId);

    const response = await fetch('?/deleteCard', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      window.location.reload();
    }
  }

  async function deleteColumn(columnId: ColumnId) {
    if (!confirm('Delete this column and all its cards?')) return;

    const formData = new FormData();
    formData.append('columnId', columnId);

    const response = await fetch('?/deleteColumn', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      window.location.reload();
    }
  }
</script>

<svelte:head>
  <title>{data.board.name} - Kanban Board</title>
</svelte:head>

<div class="p-8 max-w-full">
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold mb-2">{data.board.name}</h1>
      <a href="/kanban" class="text-blue-600 hover:underline">← Back to Boards</a>
    </div>
    <button
      onclick={() => showNewColumnForm = !showNewColumnForm}
      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      + New Column
    </button>
  </div>

  {#if showNewColumnForm}
    <form method="POST" action="?/createColumn" use:enhance class="mb-6 p-4 bg-white rounded-lg border border-gray-200 max-w-md">
      <h3 class="font-semibold mb-3">Create New Column</h3>
      <input
        type="text"
        name="name"
        placeholder="Column name"
        required
        class="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
      />
      <div class="flex gap-2">
        <button
          type="submit"
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Create
        </button>
        <button
          type="button"
          onclick={() => showNewColumnForm = false}
          class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  {/if}

  <div class="flex gap-4 overflow-x-auto pb-4">
    {#if columns.length > 0}
      {#each columns as column (column.id)}
        <div class="flex-shrink-0 w-80 bg-gray-100 rounded-lg p-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-lg">{column.name}</h2>
            <button
              onclick={() => deleteColumn(column.id)}
              class="text-red-500 hover:text-red-700 text-sm"
              title="Delete column"
            >
              ✕
            </button>
          </div>
          
          <div
            use:dndzone={{items: column.items, flipDurationMs, type: 'card'}}
            onconsider={(e) => handleColumnDndConsider(e, column.id)}
            onfinalize={(e) => handleColumnDndFinalize(e, column.id)}
            class="space-y-2 min-h-[100px] mb-3 rounded-md transition-colors {column.items.length === 0 ? 'border-2 border-dashed border-gray-300 bg-gray-50' : ''}"
          >
            {#if column.items.length === 0}
              <div class="flex items-center justify-center h-24 text-gray-400 text-sm">
                Drop cards here or click "+ Add Card" below
              </div>
            {/if}
            {#each column.items as card (card.id)}
              <div class="bg-white rounded-md p-3 shadow-sm border border-gray-200 group relative cursor-move">
                <button
                  onclick={() => deleteCard(card.id)}
                  class="absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete card"
                >
                  ✕
                </button>
                <div class="prose prose-sm max-w-none">
                  {@html card.content}
                </div>
              </div>
            {/each}
          </div>

          {#if showNewCardForm[column.id]}
            <div class="bg-white rounded-md p-3 border border-gray-300 mb-2">
              <QuillEditor
                bind:this={quillEditors[column.id]}
                placeholder="Enter card content..."
              />
              <div class="flex gap-2 mt-2">
                <button
                  onclick={() => handleCardSubmit(column.id)}
                  class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Add Card
                </button>
                <button
                  onclick={() => toggleNewCardForm(column.id)}
                  class="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          {:else}
            <button
              onclick={() => toggleNewCardForm(column.id)}
              class="w-full px-3 py-2 text-gray-600 hover:bg-gray-200 rounded-md transition-colors text-sm"
            >
              + Add Card
            </button>
          {/if}
        </div>
      {/each}
    {:else}
      <p class="text-gray-500">No columns found. Create one to get started!</p>
    {/if}
  </div>
</div>

<style>
  :global(.prose) {
    color: #374151;
  }
  :global(.prose h1) {
    font-size: 1.5em;
    font-weight: bold;
    margin: 0.5em 0;
  }
  :global(.prose h2) {
    font-size: 1.25em;
    font-weight: bold;
    margin: 0.5em 0;
  }
  :global(.prose h3) {
    font-size: 1.1em;
    font-weight: 600;
    margin: 0.5em 0;
  }
  :global(.prose ul, .prose ol) {
    margin: 0.5em 0;
    padding-left: 1.5em;
  }
  :global(.prose a) {
    color: #2563eb;
    text-decoration: underline;
  }
</style>
