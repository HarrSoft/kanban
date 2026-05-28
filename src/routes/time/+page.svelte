<script lang="ts">
	import * as df from "date-fns";
	import { onDestroy } from "svelte";
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import type { PageData } from "./$types";
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
		pingClock,
	} from "$lib/remote";
	import type { Project, Seconds, Timeclock, Unix } from "$types";

	let { data }: { data: PageData } = $props();

	let selectedProjectId = $state(data.selectedProjectId);
	let timeclocks: Timeclock[] = $state(data.timeclocks as Timeclock[]);

	function onProjectChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const newId = target.value;
		selectedProjectId = newId;
		goto(`/time?project=${newId}`, { replaceState: true });
	}

	//////////////////
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

			await pingClock({
				timeclockId: state.clock.id,
				newDuration: getNewDuration(),
			});
		}
	};

	const startClock = (clock: Timeclock) => async () => {
		if (active) {
			stopClock();
		}

		const displayTimer = setInterval(() => {
			if (active) {
				active.displayDuration = getNewDuration();
			}
		}, 200);

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

	onDestroy(() => {
		if (active) {
			clearInterval(active.displayTimer);
			clearInterval(active.updateTimer);
		}
	});

	const getNewDuration = () => {
		if (active) {
			const now = df.getUnixTime(new Date());
			const diff = now - active.lastUpdate;
			return active.clock.duration + diff;
		}
		return 0;
	};

	const formatDuration = (duration: Seconds) => {
		const hours = Math.floor(duration / 3600);
		const minutes = Math.floor((duration % 3600) / 60);
		const secs = duration % 60;
		return [hours > 0 ? hours : null, (minutes + "").padStart(2, "0"), (secs + "").padStart(2, "0")]
			.filter((x) => x !== null)
			.join(":");
	};

	const formatDurationLong = (duration: Seconds) => {
		const hours = Math.floor(duration / 3600);
		const minutes = Math.floor((duration % 3600) / 60);
		if (hours > 0) return `${hours}h ${minutes}m`;
		return `${minutes}m`;
	};
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Time Tracking</h1>
		{#if data.userProjects.length > 0}
			<div class="flex items-center gap-2">
				<label for="project-select" class="text-sm text-muted-foreground sr-only">Project</label>
				<select
					id="project-select"
					value={selectedProjectId}
					onchange={onProjectChange}
					class="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent"
				>
					{#each data.userProjects as proj (proj.id)}
						<option value={proj.id}>{proj.name}</option>
					{/each}
				</select>
			</div>
		{/if}
	</div>

	<!-- Summary Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		<div class="card p-4 rounded-lg shadow-sm border border-border">
			<div class="text-sm text-muted-foreground">Today</div>
			<div class="text-2xl font-bold">
				{formatDurationLong(data.totalDurationToday)}
			</div>
		</div>
		<div class="card p-4 rounded-lg shadow-sm border border-border">
			<div class="text-sm text-muted-foreground">This Week (7 days)</div>
			<div class="text-2xl font-bold">
				{formatDurationLong(data.totalDurationThisWeek)}
			</div>
		</div>
		<div class="card p-4 rounded-lg shadow-sm border border-border">
			<div class="text-sm text-muted-foreground">Total Entries</div>
			<div class="text-2xl font-bold">{data.timeclocks.length}</div>
		</div>
	</div>

	{#if data.userProjects.length === 0}
		<div class="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
			<p class="text-lg">No project selected.</p>
			<p class="text-sm mt-1">Join or create a project to start tracking time.</p>
		</div>
	{:else}
		<form id="create" {...createTimeclock}></form>
		<form id="delete" {...deleteTimeclock}></form>

		<!-- Timeclock Table -->
		<div class="rounded-lg border border-border overflow-hidden">
			<table class="table-auto w-full">
				<thead>
					<tr class="bg-muted/50">
						<th class="text-left px-4 py-2 font-semibold text-sm">Date</th>
						<th class="text-left px-4 py-2 font-semibold text-sm">Start Time</th>
						<th class="text-left px-4 py-2 font-semibold text-sm">Duration</th>
						<th class="text-left px-4 py-2 font-semibold text-sm hidden sm:table-cell">Notes</th>
						<th class="text-right px-4 py-2 font-semibold text-sm">Actions</th>
					</tr>
				</thead>

				<tbody class="*:even:bg-muted/20">
					{#each timeclocks as clock (clock.id)}
						{@const start = df.fromUnixTime(clock.start)}
						{@const iAmActive = active?.clock.id === clock.id}
						<tr class={["*:px-4 *:py-2", iAmActive ? "border-2 border-accent bg-accent/5" : "border-t border-border"]}>
							<td>{df.format(start, "d MMM, y")}</td>
							<td>{df.format(start, "h:mm b")}</td>
							<td>
								{#if iAmActive}
									<span class="font-mono tabular-nums">{formatDuration(active!.displayDuration)}</span>
								{:else}
									<span class="font-mono tabular-nums">{formatDuration(clock.duration)}</span>
								{/if}
								{#if clock.locked}
									<LockIcon className="inline h-4 ml-1 text-muted-foreground" />
								{/if}
							</td>
							<td class="px-4 py-2 hidden sm:table-cell max-w-[160px]">
								{#if clock.notes}
									<span class="text-xs text-muted-foreground truncate block" title={clock.notes}>
										{clock.notes}
									</span>
								{:else}
									<span class="text-xs text-muted-foreground/50 italic">—</span>
								{/if}
							</td>
							<td class="text-right">
								<div class="flex justify-end gap-2">
									{#if !clock.locked}
										{#if iAmActive}
											<button onclick={stopClock} class="button solid p-1" title="Stop">
												<PauseIcon className="h-4" />
											</button>
										{:else}
											<button onclick={startClock(clock)} class="button solid p-1" title="Start">
												<PlayIcon className="h-4" />
											</button>
										{/if}
										<a href={`/time/${clock.id}`} class="button solid p-1" title="Edit">
											<EditIcon className="h-4" />
										</a>
										<button
											form="delete"
											{...deleteTimeclock.fields.timeclockId.as("submit", clock.id)}
											class="button solid p-1 text-red-500"
											title="Delete"
										>
											<TrashIcon className="h-4" />
										</button>
									{:else}
										<span class="text-xs text-muted-foreground">Locked</span>
									{/if}
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="5" class="text-center py-8 text-muted-foreground">
								No time entries yet. Click "+ New" to start tracking.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- New Time Entry Button -->
		<div class="flex justify-end">
			<button
				form="create"
				{...createTimeclock.fields.projectId.as("submit", selectedProjectId ?? '')}
				class="button solid"
			>
				+ New Entry
			</button>
		</div>
	{/if}
</div>
