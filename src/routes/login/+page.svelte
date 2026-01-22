<script lang="ts">
  import { login } from "$lib/remote";
</script>

<form {...login} class="mx-auto flex flex-col items-center gap-2">
  <h1 class="text-xl font-bold">Login</h1>

  <label>
    <h2>Email</h2>
    <input {...login.fields.email.as("email")} />
    {#each login.fields.email.issues() || [] as issue}
      <p class="text-red-500">{issue.message}</p>
    {/each}
  </label>

  <label>
    <h2>Password</h2>
    <input {...login.fields._password.as("password")} />
    {#each login.fields._password.issues() || [] as issue}
      <p class="text-red-500">{issue.message}</p>
    {/each}
  </label>

  <button type="submit" class="button solid">Submit</button>
</form>
