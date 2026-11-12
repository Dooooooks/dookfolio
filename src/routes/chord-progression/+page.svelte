<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowLeft, Maximize, Minimize } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import ChordTrainer from '$lib/components/ChordTrainer.svelte';
	import PluckStrings from '$lib/components/PluckStrings.svelte';
	import VolumeControl from '$lib/components/VolumeControl.svelte';

	// The game's box: the background strings stay out of it
	let game = $state<HTMLDivElement | null>(null);

	// Optional real browser fullscreen (hides the address bar etc.); not offered where unsupported,
	// e.g. Safari on iPhone
	let canFullscreen = $state(false);
	let isFullscreen = $state(false);

	onMount(() => {
		canFullscreen = document.fullscreenEnabled;
		const sync = () => (isFullscreen = document.fullscreenElement !== null);
		document.addEventListener('fullscreenchange', sync);
		return () => document.removeEventListener('fullscreenchange', sync);
	});

	function toggleFullscreen() {
		if (document.fullscreenElement) {
			document.exitFullscreen().catch(() => {});
		} else {
			document.documentElement.requestFullscreen().catch(() => {});
		}
	}
</script>

<svelte:head>
	<title>Chord Progression — Lloyd Nicolas</title>
	<meta
		name="description"
		content="Chord progression ear training: hear four chords, name the progression, beat your high score."
	/>
</svelte:head>

<div
	class="relative flex min-h-dvh w-full flex-col items-center justify-center bg-bg px-4 py-16 select-none"
>
	<!-- Pluckable strings fill the empty space around the game; sweep the mouse across them -->
	<PluckStrings avoid={game} />

	<div class="fixed top-3.5 right-3 left-3 z-10 flex items-center justify-between">
		<a
			href={resolve('/')}
			class="flex h-8 items-center gap-1.5 rounded-none border border-white/10 bg-surface/80 px-2.5 text-xs font-bold text-muted backdrop-blur transition-colors hover:border-white/20 hover:text-white"
		>
			<ArrowLeft class="size-3.5" /> Portfolio
		</a>
		{#if canFullscreen}
			<button
				type="button"
				onclick={toggleFullscreen}
				aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
				title={isFullscreen ? 'Exit full screen' : 'Full screen'}
				class="flex size-8 cursor-pointer items-center justify-center rounded-none border border-white/10 bg-surface/80 text-muted backdrop-blur transition-colors hover:border-white/20 hover:text-white"
			>
				{#if isFullscreen}
					<Minimize class="size-4" />
				{:else}
					<Maximize class="size-4" />
				{/if}
			</button>
		{/if}
	</div>

	<div bind:this={game} class="relative flex w-full max-w-xl flex-col items-center">
		<ChordTrainer>
			{#snippet actions()}
				<VolumeControl />
			{/snippet}
		</ChordTrainer>
	</div>
</div>
