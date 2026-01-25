<script lang="ts">
  import { createInvite } from "$lib/remote";
  import { PlatformRole } from "$types";
</script>

<form {...createInvite} class="flex flex-col gap-2">
  <h1 class="text-xl font-bold">Create new invite</h1>

  <label>
    <h2>Email</h2>
    <input {...createInvite.fields.email.as("email")} />
    {#each createInvite.fields.email.issues() || [] as issue}
      <span class="text-red-500">{issue.message}</span>
    {/each}
  </label>

  <label>
    <h2>Platform Role</h2>
    <select
      {...createInvite.fields.platformRole.as("select")}
      class="rounded-lg bg-transparent"
    >
      {#each PlatformRole.options as role}
        <option>{role}</option>
      {/each}
    </select>
    {#each createInvite.fields.platformRole.issues() || [] as issue}
      <span class="text-red-500">{issue.message}</span>
    {/each}
  </label>

  <button class="button solid w-fit">Submit</button>
</form>
