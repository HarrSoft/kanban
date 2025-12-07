<script lang="ts">
  import { dndzone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import Card from './Card.svelte';
  import { enhance } from '$app/forms';

  export let column: { id: string; name: string; cards: any[] };
  export let onDrop: (columnId: string, items: any[]) => void;
  export let onDeleteCard: (cardId: string) => void;
  export let onDeleteColumn: (columnId: string) => void;

  const flipDurationMs = 200;

  function handleDndConsider(e: CustomEvent<DndEvent<any>>) {
    column.cards = e.detail.items;
  }

  function handleDndFinalize(e: CustomEvent<DndEvent<any>>) {
    column.cards = e.detail.items;
    onDrop(column.id, e.detail.items);
  }
  
  // New card form
  let isAddingCard = false;
  let newCardContent = '';
  let quillEditor: HTMLDivElement;
  let quill: any;

  import Quill from 'quill';
  import 'quill/dist/quill.snow.css';
  import { onMount } from 'svelte';

  function toggleAddCard() {
      isAddingCard = !isAddingCard;
      if (isAddingCard) {
          setTimeout(() => {
              if (quillEditor && !quill) {
                  quill = new Quill(quillEditor, {
                      theme: 'snow',
                      modules: {
                          toolbar: [['bold', 'italic', 'underline'], ['clean']]
                      }
                  });
              }
          }, 0);
      }
  }

  function submitCard() {
      if (quill) {
          newCardContent = JSON.stringify(quill.getContents());
      }
      // The form will handle the submission, we just needed to populate the hidden input
  }
</script>

<div class="w-72 flex-shrink-0 flex flex-col max-h-full bg-gray-100 rounded-lg mr-4">
  <!-- Header -->
  <div class="p-3 flex justify-between items-center font-semibold text-gray-700">
    <h3>{column.name}</h3>
    <button 
      class="text-gray-400 hover:text-red-500"
      on:click={() => onDeleteColumn(column.id)}
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  </div>

  <!-- Cards Area -->
  <div 
    class="flex-1 overflow-y-auto p-2 min-h-[100px]"
    use:dndzone={{items: column.cards, flipDurationMs}}
    on:consider={handleDndConsider}
    on:finalize={handleDndFinalize}
  >
    {#each column.cards as card (card.id)}
      <div animate:flip={{duration: flipDurationMs}}>
        <Card {card} onDelete={onDeleteCard} />
      </div>
    {/each}
  </div>

  <!-- Footer / Add Card -->
  <div class="p-2">
    {#if isAddingCard}
      <form 
        method="POST" 
        action="?/createCard" 
        use:enhance={() => {
            return async ({ update }) => {
                await update();
                isAddingCard = false;
                if (quill) {
                    quill.setText('');
                }
            };
        }}
        class="bg-white p-2 rounded shadow-sm"
        on:submit={submitCard}
      >
        <input type="hidden" name="columnId" value={column.id} />
        <input type="hidden" name="content" bind:value={newCardContent} />
        
        <div class="mb-2" bind:this={quillEditor}></div>
        
        <div class="flex justify-end gap-2 mt-2">
            <button type="button" class="text-sm text-gray-500" on:click={toggleAddCard}>Cancel</button>
            <button type="submit" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Add</button>
        </div>
      </form>
    {:else}
      <button 
        class="w-full text-left p-2 text-gray-500 hover:bg-gray-200 rounded flex items-center gap-2"
        on:click={toggleAddCard}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add a card
      </button>
    {/if}
  </div>
</div>
