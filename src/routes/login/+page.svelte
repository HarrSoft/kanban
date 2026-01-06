<script lang="ts">
  import { goto } from "$app/navigation";
  import { login } from "./login.remote";

  let email = $state("");
  let password = $state("");
  let error = $state("");

  let doingLogin = false;
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
    goto("/project");
  };
</script>

<div class="m-4 grid grid-cols-[5rem_15rem] items-center gap-2">
  <h1 class="col-span-2 font-bold">Login</h1>

  {#if error}
    <span class="text-red-500 col-span-2">
      Error: {error}
    </span>
  {/if}

  <label for="email">Email</label>
  <input
    name="email"
    type="email"
    bind:value={email}
    class="rounded-md bg-transparent"
    oninput={() => {
      error = "";
    }}
  />

  <label for="password">Password</label>
  <input
    name="password"
    type="password"
    bind:value={password}
    class="rounded-md bg-transparent"
    oninput={() => {
      error = "";
    }}
  />

  <button
    type="submit"
    onclick={doLogin}
    class={[
      "rounded-md border-2 px-4 py-2",
      "hover:bg-[var(--shadow)]",
      "col-span-2 font-bold",
    ]}
    disabled={!email || !password}
  >
    Submit
  </button>
</div>
