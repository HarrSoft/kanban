<script lang="ts">
  import { buttonThemes } from "$com/widgets";
  import { login } from "$lib/remote";
</script>

<form {...login} class="mx-auto flex flex-col items-center gap-2">
  <h1 class="text-xl font-bold">Login</h1>

  <label>
    <h2>Email</h2>
    <input
      {...login.fields.email.as("email")}
      class="rounded-md bg-transparent"
    />
    {#each login.fields.email.issues() || [] as issue}
      <p class="text-red-500">{issue.message}</p>
    {/each}
  </label>

  <label>
    <h2>Password</h2>
    <input
      {...login.fields._password.as("password")}
      type="password"
      class="rounded-md bg-transparent"
    />
    {#each login.fields._password.issues() || [] as issue}
      <p class="text-red-500">{issue.message}</p>
    {/each}
  </label>

  <button
    type="submit"
    class={[buttonThemes.solid.base, buttonThemes.solid.enabled]}
  >
    Submit
  </button>
</form>
