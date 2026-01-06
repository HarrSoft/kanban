<script lang="ts">
  import { page } from "$app/state";
</script>

<div class="m-auto flex flex-col items-center justify-center">
  <h1 class="text-lg">{page.status}</h1>
  <h2 class="text-lg">{page.error.message}</h2>
</div>
