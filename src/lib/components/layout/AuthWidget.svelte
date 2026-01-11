<script lang="ts">
  import { page } from "$app/state";

  const session = $derived(page.data.session);
</script>

<div class="flex">
  {#if session}
    <input
      type="email"
      disabled
      class="rounded-l-lg !rounded-r-none"
      value={session.userEmail} />
    <a
      class="rounded-r-lg bg-hilight px-4 py-2 font-bold text-invert hover:bg-alt"
      href="/logout">
      Logout
    </a>
  {:else}
    <a
      class="rounded-lg bg-hilight px-4 py-2 font-bold text-invert hover:bg-alt"
      href="/login">
      Login
    </a>
  {/if}
</div>
