<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  let editorContainer: HTMLDivElement;
  let quill: any = null;
  let Quill: any = null;

  export let placeholder = 'Enter text...';
  export let initialContent = '';

  // Expose methods to parent
  export function getHTML(): string {
    if (!quill) return '';
    return quill.root.innerHTML;
  }

  export function setHTML(html: string) {
    if (!quill) return;
    quill.root.innerHTML = html;
  }

  export function clear() {
    if (!quill) return;
    quill.setText('');
  }

  onMount(async () => {
    if (!browser) return;

    // Dynamically import Quill only on the client
    const QuillModule = await import('quill');
    Quill = QuillModule.default;
    
    // Also import the CSS
    await import('quill/dist/quill.snow.css');

    quill = new Quill(editorContainer, {
      theme: 'snow',
      placeholder,
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link'],
          ['clean']
        ]
      }
    });

    if (initialContent) {
      quill.root.innerHTML = initialContent;
    }

    return () => {
      if (quill) {
        quill = null;
      }
    };
  });
</script>

<div bind:this={editorContainer} class="quill-editor"></div>

<style>
  :global(.quill-editor) {
    background: white;
  }
  
  :global(.ql-toolbar) {
    border-top-left-radius: 0.375rem;
    border-top-right-radius: 0.375rem;
  }
  
  :global(.ql-container) {
    border-bottom-left-radius: 0.375rem;
    border-bottom-right-radius: 0.375rem;
    min-height: 150px;
  }
</style>
