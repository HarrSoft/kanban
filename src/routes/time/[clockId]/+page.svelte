<script lang="ts">
	import * as df from "date-fns";
	import { updateTimeclock } from "$lib/remote";
	import { Chevron, LockIcon, PauseIcon, PlayIcon } from "$com/icons";
	import type { Seconds, Unix } from "$types";

	let { data } = $props();
	let clock = $state(data.clock);

	// Format helpers
	const fmtDuration = (duration: Seconds) => {
		const hours = Math.floor(duration / 3600);
		const minutes = Math.floor((duration % 3600) / 60);
		const secs = duration % 60;
		return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
	};

	const parseDuration = (formatted: string): Seconds | null => {
		const parts = formatted.split(":").map(Number);
		if (parts.length !== 3 || parts.some(isNaN)) return null;
		return parts[0] * 3600 + parts[1] * 60 + parts[2];
	};

	// Editable fields (strings for display, converted to numbers on submit)
	let startInput = $state(df.format(df.fromUnixTime(clock.start), "yyyy-MM-dd'T'HH:mm"));
	let durInput = $state(fmtDuration(clock.duration));
	let notesInput = $state(clock.notes ?? "");
	let startError = $state("");
	let durError = $state("");

	// Convert to submit-ready values
	const getStartUnix = (): Unix | null => {
		const d = new Date(startInput);
		if (isNaN(d.getTime())) { startError = "Invalid date"; return null; }
		startError = "";
		return Math.floor(d.getTime() / 1000);
	};
	const getDuration = (): Seconds | null => {
		const parsed = parseDuration(durInput);
		if (parsed === null) { durError = "Use format HH:MM:SS"; return null; }
		durError = "";
		return parsed;
	};

	let isChanged = $derived(
		startInput !== df.format(df.fromUnixTime(clock.start), "yyyy-MM-dd'T'HH:mm") ||
		durInput !== fmtDuration(clock.duration) ||
		notesInput !== (clock.notes ?? "")
	);
</script>

<div class="max-w-lg mx-auto mt-8 p-6">
	<!-- Back link -->
	<a href="/time" class="text-muted hover:text-text flex items-center gap-1 mb-6">
		<Chevron className="h-4 rotate-180" />
		Back to Time
	</a>

	<!-- Header -->
	<h1 class="text-2xl font-bold mb-2">
		Timeclock {#if clock.locked}<LockIcon className="h-5 inline" />{/if}
	</h1>

	<p class="text-muted text-sm mb-6">
		Created {df.format(df.fromUnixTime(clock.createdAt), "d MMM y, h:mm b")}
		&middot; #{clock.id.slice(0, 8)}
	</p>

	<!-- Editable fields -->
	<form
		{...updateTimeclock}
		method="POST"
		class="space-y-4"
	>
		<input type="hidden" name="timeclockId" value={clock.id} />

		<!-- Start time -->
		<label class="block">
			<span class="text-sm font-medium">Start Time</span>
			<input
				type="datetime-local"
				bind:value={startInput}
				class="input mt-1 w-full"
				disabled={clock.locked}
			/>
			<input type="hidden" name="start" value={getStartUnix() ?? clock.start} />
		</label>
		{#if startError}
			<p class="text-red-500 text-xs">{startError}</p>
		{/if}

		<!-- Duration -->
		<label class="block">
			<span class="text-sm font-medium">Duration</span>
			<input
				type="text"
				bind:value={durInput}
				placeholder="HH:MM:SS"
				class={["input mt-1 w-full font-mono", durError ? "border-red-500" : ""]}
				disabled={clock.locked}
			/>
			<input type="hidden" name="duration" value={getDuration() ?? clock.duration} />
			<p class="text-xs text-muted mt-1">Format: HH:MM:SS</p>
		</label>
		{#if durError}
			<p class="text-red-500 text-xs">{durError}</p>
		{/if}

		<!-- Notes -->
		<label class="block">
			<span class="text-sm font-medium">Notes</span>
			<textarea
				bind:value={notesInput}
				rows={2}
				class="input mt-1 w-full"
				placeholder="What were you working on?"
				disabled={clock.locked}
			></textarea>
			<input type="hidden" name="notes" value={notesInput} />
		</label>

		<!-- Status display -->
		<div class="bg-shadow rounded-lg p-4 space-y-2 text-sm">
			<div class="flex justify-between">
				<span class="text-muted">Status</span>
				<span>{clock.locked ? "🔒 Locked" : "🔓 Unlocked"}</span>
			</div>
			<div class="flex justify-between">
				<span class="text-muted">Recorded Duration</span>
				<span class="font-mono">{fmtDuration(clock.duration)}</span>
			</div>
			<div class="flex justify-between">
				<span class="text-muted">Started</span>
				<span>{df.format(df.fromUnixTime(clock.start), "h:mm b, d MMM y")}</span>
			</div>
		</div>

		<!-- Actions -->
		<div class="flex gap-3 pt-2">
			{#if !clock.locked && isChanged}
				<button type="submit" class="button solid">
					Save Changes
				</button>
			{/if}
			<a href="/time" class="button outline">
				Cancel
			</a>
		</div>
	</form>
</div>
