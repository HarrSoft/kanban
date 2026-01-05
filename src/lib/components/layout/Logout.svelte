<script lang="ts">
  import { page } from "$app/state";
</script>

<div class="flex gap-2">
  <span class="px-4 py-2">
    {page.data.session?.userEmail}
  </span>
  <a class="bg-red-500 px-4 py-2 font-bold text-white" href="/logout">
    Logout
  </a>
</div>
