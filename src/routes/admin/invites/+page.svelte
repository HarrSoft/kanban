<script lang="ts">
  import * as df from "date-fns";
  import { TrashIcon } from "$com/icons";
  import { deleteInvite, fetchAllInvites } from "$lib/remote";
  import { Unix } from "$types";

  const formatUnix = (ts: Unix) => {
    const date = df.fromUnixTime(ts);
    return df.format(date, "LLL do, y @ h:mm a");
  };
</script>

<div class="flex flex-col gap-2">
  <div class="flex w-full justify-between">
    <h1 class="text-xl font-bold">Pending Invites</h1>
    <a href="/admin/invites/create" class="button solid">
      + Create new invite
    </a>
  </div>

  <form {...deleteInvite} class="grid grid-cols-3 items-center gap-2">
    <span class="font-bold">Email</span>
    <span class="font-bold">Expires</span>
    <span class="font-bold">Actions</span>

    {#each await fetchAllInvites() as invite}
      <span>{invite.email}</span>

      <span>{formatUnix(invite.expiresAt)}</span>

      <span class="flex gap-10">
        <a href={`/invite/${invite.code}`} class="font-bold text-accent">
          invite link
        </a>

        <button
          {...deleteInvite.fields.email.as("submit", invite.email)}
          class="cursor-pointer"
        >
          <TrashIcon className="text-red-500 h-full" />
        </button>
      </span>
    {/each}
  </form>
</div>
