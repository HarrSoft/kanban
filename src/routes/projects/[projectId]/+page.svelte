<script lang="ts">
  import { Project } from "$com";
  import { page } from "$app/state";
  import { getProject } from "$lib/remote";
  import { UserInfo } from "$types";

  const project = $derived(await getProject(page.params.projectId!));
</script>

<div class="flex flex-col gap-2">
  <Project {project} />

  <!-- Project members -->
  {#if project.admins.length > 0}
    <h2 class="text-lg font-bold">Project Admins</h2>
    {#each project.admins as admin}
      {@render userLine(admin)}
    {/each}
  {/if}
  {#if project.contributors.length > 0}
    <h2 class="text-lg font-bold">Project Contributors</h2>
    {#each project.contributors as contributor}
      {@render userLine(contributor)}
    {/each}
  {/if}
  {#if project.viewers.length > 0}
    <h2 class="text-lg font-bold">Project Viewers</h2>
    {#each project.viewers as viewer}
      {@render userLine(viewer)}
    {/each}
  {/if}
</div>

{#snippet userLine(user: UserInfo)}
  <div class="flex gap-2">
    {#if user.name}
      <span>{user.name} ({user.email})</span>
    {:else}
      <span>{user.email}</span>
    {/if}
  </div>
{/snippet}
