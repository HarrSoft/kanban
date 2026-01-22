<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { createUser, fetchInviteEmail } from "$lib/remote";

  const email = $derived(fetchInviteEmail(page.params.code!));
  let name = $state("");
  let password = $state("");
  let confirm = $state("");
  let error = $state("");

  let doingSignup = $state(false);
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

<form class="mx-auto flex flex-col items-center gap-2" {...createUser}>
  <h1 class="col-span-2 font-bold">Create your account</h1>

  <label>
    <h2>Email</h2>
    <input value={email} disabled class="rounded-md bg-transparent" />
  </label>

  <label>
    <h2>Name</h2>
    <input
      {...createUser.fields.name.as("text")}
      class="rounded-md bg-transparent"
    />
    {#each createUser.fields.name.issues() || [] as issue}
      <p class="text-red-500">{issue.message}</p>
    {/each}
  </label>

  <label>
    <h2>Password</h2>
    <input
      {...createUser.fields._password.as("password")}
      class="rounded-md bg-transparent"
    />
    {#each createUser.fields._password.issues() || [] as issue}
      <p class="text-red-500">{issue.message}</p>
    {/each}
  </label>

  <label>
    <h2>Confirm Password</h2>
    <input
      id="confirm"
      type="password"
      bind:value={confirm}
      oninput={clearError}
    />
  </label>

  <button
    type="submit"
    onclick={doSignup}
    disabled={password !== confirm}
    class="button solid col-span-2"
  >
    Submit
  </button>
</form>
