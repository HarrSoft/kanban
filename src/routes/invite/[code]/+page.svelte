<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { createUser } from "./createUser.remote";
  import type { PageData } from "./$types";

  const {
    data,
  }: {
    data: PageData;
  } = $props();

  let password = $state("");
  let confirm = $state("");
  let error = $state("");

  let doingSignup = false;
  const doSignup = async () => {
    if (doingSignup) {
      return;
    }
    doingSignup = true;

    if (password !== confirm) {
      error = "Passwords must match";
      doingSignup = false;
      return;
    }

    try {
      await createUser({
        inviteCode: page.params.code!,
        password,
      });
    } catch (e) {
      error = "Invite code has become invalid";
      doingSignup = false;
      return;
    }

    goto("/login");
  };
</script>

<div class="grid-cols-[10rem_auto] p-4">
  <h1 class="col-span-2 font-bold">Create your account</h1>

  {#if error}
    <span class="col-span-2 text-red-500">
      Error: {error}
    </span>
  {/if}

  <label for="email">Email</label>
  <input id="email" type="email" value={data.email} disabled />

  <label for="password">Password</label>
  <input
    id="password"
    type="password"
    bind:value={password}
    oninput={() => {
      error = "";
    }} />

  <label for="confirm">Confirm Password</label>
  <input
    name="confirm"
    type="password"
    bind:value={confirm}
    oninput={() => {
      error = "";
    }} />

  <button type="submit" onclick={doSignup} class="col-span-2"> Submit </button>
</div>
