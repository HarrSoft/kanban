<script lang="ts">
  import { page } from "$app/state";

  const session = $derived(page.data.session);
</script>

<div class="flex gap-2">
  {#if session}
    <span class="px-4 py-2">
      {session.userEmail}
    </span>
    <a class="bg-red-500 px-4 py-2 font-bold text-white" href="/logout">
      Logout
    </a>
  {:else}
    <a class="bg-green-500 px-4 py-2 font-bold text-white" href="/login">
      Login
    </a>
  {/if}
</div>
