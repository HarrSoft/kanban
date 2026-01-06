<script lang="ts">
  import { page } from "$app/state";

  const session = $derived(page.data.session);
</script>

<div class="flex">
  {#if session}
    <span class="rounded-l-lg bg-[var(--shadow)] px-4 py-2">
      {session.userEmail}
    </span>
    <a
      class="rounded-r-lg bg-red-500 px-4 py-2 font-bold text-white"
      href="/logout">
      Logout
    </a>
  {:else}
    <a
      class="rounded-lg bg-green-500 px-4 py-2 font-bold text-white"
      href="/login">
      Login
    </a>
  {/if}
</div>
