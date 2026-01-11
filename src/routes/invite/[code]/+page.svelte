<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { createUser } from "$lib/remote";
  import type { PageData } from "./$types";

  const {
    data,
  }: {
    data: PageData;
  } = $props();

  let name = $state("");
  let password = $state("");
  let confirm = $state("");
  let error = $state("");

  let doingSignup = false;
  const doSignup = async () => {
    if (doingSignup) {
      return;
    }

    if (!name.trim()) {
      error = "Please give a name";
      return;
    }

    if (password !== confirm) {
      error = "Passwords must match";
      return;
    }

    doingSignup = true;

    try {
      await createUser({
        inviteCode: page.params.code!,
        name: name.trim(),
        password,
      });
    } catch (e) {
      error = "Invite code has become invalid";
      doingSignup = false;
      return;
    }

    goto("/login");
  };

  const clearError = () => (error = "");
</script>

<form class="m-auto grid grid-cols-[5rem_15rem] items-center gap-2">
  <h1 class="col-span-2 font-bold">Create your account</h1>

  {#if error}
    <span class="col-span-2 text-red-500">
      Error: {error}
    </span>
  {/if}

  <label for="email">Email</label>
  <input id="email" type="email" value={data.email} disabled />

  <label for="name">Name</label>
  <input id="name" type="text" bind:value={name} oninput={clearError} />

  <label for="password">Password</label>
  <input
    id="password"
    type="password"
    bind:value={password}
    oninput={clearError} />

  <label for="confirm">Confirm Password</label>
  <input
    id="confirm"
    type="password"
    bind:value={confirm}
    oninput={clearError} />

  <button type="submit" onclick={doSignup} class="col-span-2">Submit</button>
</form>
