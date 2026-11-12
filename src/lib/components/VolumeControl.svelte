<script lang="ts">
	import { Music } from '@lucide/svelte';
	import { instrumentVolume, synth } from '$lib/synth.svelte';

	// A music icon that stretches leftward into a volume slider on hover (or focus, for touch and
	// keyboards). It must sit right-anchored so it grows to the left, ending where the icon was.

	// Extra classes for the box, e.g. a border/background to match the buttons beside it
	let { class: extraClass = '' }: { class?: string } = $props();

	const volume = $derived(instrumentVolume.value);
	const muted = $derived(volume === 0);
	// Restored when unmuting with the icon
	let lastAudible = 1;

	function setVolume(value: number) {
		if (value > 0) lastAudible = value;
		synth.setInstrumentVolume(value);
	}

	function toggleMute() {
		setVolume(muted ? lastAudible || 1 : 0);
	}

	// Touch screens can't hover, so the first tap only opens the slider; later taps mute/unmute
	let box: HTMLDivElement;
	let iconButton: HTMLButtonElement;
	let openOnTap = false;

	function rememberOpenState(e: PointerEvent) {
		openOnTap = e.pointerType !== 'mouse' && !box.matches(':focus-within');
	}

	function handleIconClick() {
		if (openOnTap) {
			openOnTap = false;
			iconButton.focus(); // Safari doesn't focus buttons on tap by itself
			return;
		}
		toggleMute();
	}

	// Arrow / Home / End keys belong to the slider while it's focused, not the piano or game shortcuts
	function keepKeysOnSlider(e: KeyboardEvent) {
		if (/^(Arrow|Home$|End$|Page)/.test(e.key)) e.stopPropagation();
	}
</script>

<div
	bind:this={box}
	class="group relative z-10 flex h-8 w-8 items-center overflow-hidden rounded-none transition-[width,background-color,box-shadow] duration-300 ease-out focus-within:w-44 focus-within:bg-surface focus-within:shadow-[0_10px_24px_-12px_rgba(0,0,0,0.7)] hover:w-44 hover:bg-surface hover:shadow-[0_10px_24px_-12px_rgba(0,0,0,0.7)] {extraClass}"
>
	<button
		type="button"
		data-custom-sound
		bind:this={iconButton}
		onpointerdown={rememberOpenState}
		onclick={handleIconClick}
		aria-label={muted ? 'Unmute music' : 'Mute music'}
		title={muted ? 'Unmute' : 'Mute'}
		class="relative flex size-8 shrink-0 cursor-pointer items-center justify-center text-muted transition-colors hover:text-white focus:outline-hidden"
	>
		<Music class="size-4 transition-opacity {muted ? 'opacity-40' : ''}" />
		{#if muted}
			<span aria-hidden="true" class="absolute h-0.5 w-5 rotate-45 bg-current"></span>
		{/if}
	</button>
	<input
		type="range"
		min="0"
		max="1"
		step="0.01"
		value={volume}
		oninput={(e) => setVolume(Number(e.currentTarget.value))}
		onkeydown={keepKeysOnSlider}
		aria-label="Music volume"
		aria-valuetext="{Math.round(volume * 100)}%"
		style="--fill: {volume * 100}%"
		class="volume-slider mr-2.5 min-w-0 flex-1 cursor-pointer opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100"
	/>
</div>

<style>
	/* Thin track filled in the accent color up to the handle; square handle to match the theme */
	.volume-slider {
		appearance: none;
		height: 1rem;
		background: transparent;
	}
	.volume-slider::-webkit-slider-runnable-track {
		height: 3px;
		background: linear-gradient(
			to right,
			var(--color-accent) var(--fill),
			rgb(255 255 255 / 0.15) var(--fill)
		);
	}
	.volume-slider::-moz-range-track {
		height: 3px;
		background: rgb(255 255 255 / 0.15);
	}
	.volume-slider::-moz-range-progress {
		height: 3px;
		background: var(--color-accent);
	}
	.volume-slider::-webkit-slider-thumb {
		appearance: none;
		margin-top: -4px;
		width: 11px;
		height: 11px;
		background: var(--color-accent);
		box-shadow: 0 0 0 2px rgb(182 148 255 / 0.2);
		transition: transform 150ms;
	}
	.volume-slider::-moz-range-thumb {
		width: 12px;
		height: 12px;
		border: 0;
		border-radius: 0;
		background: var(--color-accent);
		box-shadow: 0 0 0 2px rgb(182 148 255 / 0.2);
	}
	.volume-slider:active::-webkit-slider-thumb {
		transform: scale(1.2);
	}
	.volume-slider:focus-visible {
		outline: none;
	}
	.volume-slider:focus-visible::-webkit-slider-thumb {
		box-shadow: 0 0 0 4px rgb(182 148 255 / 0.45);
	}
</style>
