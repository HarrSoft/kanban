<script lang="ts">
  import { onMount } from 'svelte';
  import Quill from 'quill';
  import 'quill/dist/quill.snow.css';

  export let card: { id: string; content: string };
  export let onDelete: (id: string) => void;

  let editorContainer: HTMLDivElement;
  let quill: Quill;

  onMount(() => {
    if (editorContainer) {
      quill = new Quill(editorContainer, {
        theme: 'bubble',
        readOnly: true,
        modules: { toolbar: false }
      });
      
      // Try to parse as JSON (Delta), otherwise treat as text/html
      try {
        const delta = JSON.parse(card.content);
        quill.setContents(delta);
      } catch (e) {
        quill.setText(card.content);
      }
    }
  });
</script>

<div class="bg-white p-3 rounded shadow-sm mb-2 group relative border border-gray-200">
  <div bind:this={editorContainer} class="quill-read-only"></div>
  
  <button 
    class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
    on:click={() => onDelete(card.id)}
    aria-label="Delete card"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>
</div>

<style>
  /* Minimal override for read-only view to look like normal text */
  :global(.quill-read-only .ql-container) {
    font-family: inherit;
    font-size: inherit;
  }
  :global(.quill-read-only .ql-editor) {
    padding: 0;
    min-height: auto;
  }
</style>
