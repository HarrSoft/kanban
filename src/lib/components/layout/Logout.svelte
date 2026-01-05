<script lang="ts">
  import { page } from "$app/state";
</script>

<div class="flex gap-2">
  <span class="px-4 py-2">
    {page.data.session?.userEmail}
  </span>
  <a
    class="px-4 py-2 text-white font-bold bg-red-500"
    href="/logout"
  >
    Logout
  </a>
</div>
