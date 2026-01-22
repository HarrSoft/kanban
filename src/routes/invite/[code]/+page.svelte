<script lang="ts">
  import { page } from "$app/state";
  import { CreateUserSchema, createUser, fetchInviteEmail } from "$lib/remote";

  const code = $derived(page.params.code!);
  const email = $derived(await fetchInviteEmail(code));
</script>

<form
  {...createUser.preflight(CreateUserSchema)}
  oninput={() => createUser.validate()}
  class="mx-auto flex flex-col items-center gap-2"
>
  <h1 class="col-span-2 text-xl font-bold">Create your account</h1>

  <input {...createUser.fields.inviteCode.as("hidden", code)} />

  <label>
    <h2>Email</h2>
    <input value={email} disabled class="rounded-md bg-transparent" />
  </label>

  <label>
    <h2>Name</h2>
    <input {...createUser.fields.name.as("text")} />
    {#each createUser.fields.name.issues() || [] as issue}
      <p class="text-red-500">{issue.message}</p>
    {/each}
  </label>

  <label>
    <h2>Password</h2>
    <input {...createUser.fields._password.as("password")} />
    {#each createUser.fields._password.issues() || [] as issue}
      <p class="text-red-500">{issue.message}</p>
    {/each}
  </label>

  <label>
    <h2>Confirm Password</h2>
    <input {...createUser.fields._confirm.as("password")} />
    {#each createUser.fields._confirm.issues() || [] as issue}
      <p class="text-red-500">{issue.message}</p>
    {/each}
  </label>

  <button type="submit" class="button solid col-span-2"> Submit </button>
</form>
