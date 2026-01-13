<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { Button } from "$com/widgets";
  import { login } from "$lib/remote";

  let email = $state("");
  let password = $state("");
  let error = $state("");

  let doingLogin = $state(false);
  const doLogin = async () => {
    if (doingLogin) {
      return;
    }
    doingLogin = true;

    try {
      await login({ email, password });
    } catch {
      error = "Credentials are incorrect";
      doingLogin = false;
      return;
    }

    doingLogin = false;
    await invalidateAll();
    await goto("/");
  };
</script>

<form class="m-auto grid grid-cols-[5rem_15rem] items-center gap-2">
  {#if error}
    <span class="col-span-2 text-red-500">
      Error: {error}
    </span>
  {/if}

  <label for="email">Email</label>
  <input
    id="email"
    type="email"
    bind:value={email}
    class="rounded-md bg-transparent"
    oninput={() => {
      error = "";
    }}
  />

  <label for="password">Password</label>
  <input
    id="password"
    type="password"
    bind:value={password}
    class="rounded-md bg-transparent"
    oninput={() => {
      error = "";
    }}
  />

  <Button
    type="submit"
    onclick={doLogin}
    class="col-span-2"
    disabled={!email || !password}
    spin={doingLogin}
  >
    Login
  </Button>
</form>
