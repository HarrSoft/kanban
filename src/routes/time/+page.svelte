<script lang="ts">
  import * as df from "date-fns";
  import { onDestroy } from "svelte";
  import {
    EditIcon,
    LockIcon,
    PauseIcon,
    PlayIcon,
    TrashIcon,
  } from "$com/icons";
  import {
    createTimeclock,
    deleteTimeclock,
    getActiveProject,
    getTimeclock,
    listMyTimeclocks,
    pingClock,
  } from "$lib/remote";
  import type { Seconds, Timeclock, Unix } from "$types";

  //////////////////
  // Loading Data //
  //////////////////

  const activeProject = await getActiveProject();
  const timeclocks = await getActiveProject()
    .then(ap => {
      if (ap) {
        return listMyTimeclocks({
          projectId: ap.id,
        });
      } else {
        return [];
      }
    })
    .then(ids => Promise.all(ids.map(getTimeclock)));

  /////////////////////
  // Clock Mechanism //
  /////////////////////

  interface ClockState {
    clock: Timeclock;

    displayDuration: Seconds;
    displayTimer: ReturnType<typeof setInterval>;

    lastUpdate: Unix;
    updateTimer: ReturnType<typeof setInterval>;
  }
  let active: ClockState | null = $state(null);

  const stopClock = async () => {
    if (active) {
      const state = active;
      active = null;
      clearInterval(state.displayTimer);
      clearInterval(state.updateTimer);

      pingClock({
        timeclockId: state.clock.id,
        newDuration: getNewDuration(),
      });
    }
  };

  const startClock = (clock: Timeclock) => async () => {
    if (active) {
      stopClock();
    }

    // this timer updates the duration display every fifth of a second
    const displayTimer = setInterval(() => {
      if (active) {
        active.displayDuration = getNewDuration();
      }
    }, 200);

    // this timer saves the timer to the server every minute
    const updateTimer = setInterval(() => {
      if (active) {
        const newDuration = getNewDuration();

        pingClock({
          timeclockId: active.clock.id,
          newDuration,
        });
      }
    }, 60000);

    active = {
      clock,
      displayDuration: clock.duration,
      displayTimer,
      lastUpdate: df.getUnixTime(new Date()),
      updateTimer,
    };
  };

  // defensive coding is good
  onDestroy(() => {
    if (active) {
      clearInterval(active.displayTimer);
      clearInterval(active.updateTimer);
    }
  });

  /////////////
  // Helpers //
  /////////////

  const getNewDuration = () => {
    if (active) {
      const now = df.getUnixTime(new Date());
      const diff = now - active.lastUpdate;
      const newDuration = active.clock.duration + diff;
      return newDuration;
    } else {
      return 0;
    }
  };

  const formatDuration = (duration: Seconds) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    let fmt = [
      hours || [],
      (minutes + "").padStart(2, "0"),
      (seconds + "").padStart(2, "0"),
    ]
      .flat()
      .join(":");

    return fmt;
  };
</script>

{#if !activeProject}
  <span class="text-red-500">Error: Select a project</span>
{/if}

<form id="create" {...createTimeclock}></form>
<form id="delete" {...deleteTimeclock}></form>

<!-- List of Timeclocks -->
<table class="table-auto">
  <thead>
    <tr>
      <td colspan="3" class="text-xl font-bold">Timeclocks</td>
      <td class="text-right">
        {#if activeProject}
          <button
            form="create"
            {...createTimeclock.fields.projectId.as("submit", activeProject.id)}
            class="button solid !p-0 !px-1"
          >
            + New
          </button>
        {/if}
      </td>
    </tr>

    <tr class="bg-shadow">
      <th>Date</th>
      <th>Start Time</th>
      <th>Duration</th>
      <th>&nbsp;</th>
    </tr>
  </thead>

  <tbody class="*:even:bg-shadow">
    {#each timeclocks as clock}
      {@const start = df.fromUnixTime(clock.start)}
      {@const iAmActive = active?.clock.id === clock.id}
      <tr class={["*:px-4 *:py-1", iAmActive ? "border-2 border-accent" : []]}>
        <!-- Date -->
        <td>{df.format(start, "d MMM, y")}</td>
        <!-- Start time -->
        <td>{df.format(start, "h:mm b")}</td>
        <!-- Duration -->
        <td>
          {#if iAmActive}
            {formatDuration(active!.displayDuration)}
          {:else}
            {formatDuration(clock.duration)}
          {/if}
        </td>
        <!-- Actions -->
        <td class="flex gap-3">
          {#if clock.locked}
            <LockIcon />
          {:else}
            <!-- Start/Stop -->
            {#if iAmActive}
              <button onclick={stopClock}>
                <PauseIcon className="h-5" />
              </button>
            {:else}
              <button onclick={startClock(clock)}>
                <PlayIcon className="h-5" />
              </button>
            {/if}
            <!-- Edit button -->
            <a href={`/time/${clock.id}`}>
              <EditIcon className="h-6" />
            </a>
            <!-- Delete button -->
            <button
              form="delete"
              {...deleteTimeclock.fields.timeclockId.as("submit", clock.id)}
            >
              <TrashIcon className="text-red-500" />
            </button>
          {/if}
        </td>
      </tr>
    {:else}
      <tr><td colspan="4">No timeclocks exist in the selected range</td></tr>
    {/each}
  </tbody>
</table>
