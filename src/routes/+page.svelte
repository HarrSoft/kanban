<script lang="ts">
  let email = $state("");
  let password = $state("");

  const doLogin = () => {};
</script>

<div class="m-4 grid grid-cols-[5rem_15rem] items-center gap-2">
  <h2 class="col-span-2 font-bold">Login</h2>

  <label for="email">Email</label>
  <input
    name="email"
    type="email"
    bind:value={email}
    class="rounded-md bg-transparent" />

  <label for="password">Password</label>
  <input
    name="password"
    type="password"
    bind:value={password}
    class="rounded-md bg-transparent" />

  <button
    type="submit"
    onclick={doLogin}
    class={[
      "rounded-md border-2 px-4 py-2",
      "hover:bg-[var(--shadow)]",
      "col-span-2 font-bold",
    ]}>
    Submit
  </button>
</div>
