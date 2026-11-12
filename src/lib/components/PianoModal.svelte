<script lang="ts">
	import { ChevronLeft, ChevronRight, Piano, X } from '@lucide/svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { gameDevMode, pianoModal, closePianoModal } from '$lib/game-mode.svelte';
	import { synth, midiToFreq } from '$lib/synth.svelte';
	import { lockScroll, unlockScroll } from '$lib/scroll-lock';
	import VolumeControl from './VolumeControl.svelte';

	interface PianoKey {
		codes: string[]; // every physical key that plays this note (first one is shown on the key)
		label: string;
		semitone: number; // relative to C4 (MIDI 60)
	}

	// Same shortcuts as musicca.com/piano, mapped by physical key position: three octaves (C3–B5).
	// Left hand plays C3–B3 on Z S X D C + Q 2 W 3 E 4 R, the top letter row (T–]) is C4–C5 with the
	// number row as sharps, and the bottom/home rows (F V G B N J M K , L .) continue up to B5.
	const PIANO_KEYS: PianoKey[] = [
		{ codes: ['KeyZ'], label: 'Z', semitone: -12 },
		{ codes: ['KeyS'], label: 'S', semitone: -11 },
		{ codes: ['KeyX'], label: 'X', semitone: -10 },
		{ codes: ['KeyD'], label: 'D', semitone: -9 },
		{ codes: ['KeyC'], label: 'C', semitone: -8 },
		{ codes: ['KeyQ'], label: 'Q', semitone: -7 },
		{ codes: ['Digit2'], label: '2', semitone: -6 },
		{ codes: ['KeyW'], label: 'W', semitone: -5 },
		{ codes: ['Digit3'], label: '3', semitone: -4 },
		{ codes: ['KeyE'], label: 'E', semitone: -3 },
		{ codes: ['Digit4'], label: '4', semitone: -2 },
		{ codes: ['KeyR'], label: 'R', semitone: -1 },
		{ codes: ['KeyT'], label: 'T', semitone: 0 },
		{ codes: ['Digit6'], label: '6', semitone: 1 },
		{ codes: ['KeyY'], label: 'Y', semitone: 2 },
		{ codes: ['Digit7'], label: '7', semitone: 3 },
		{ codes: ['KeyU'], label: 'U', semitone: 4 },
		{ codes: ['KeyI'], label: 'I', semitone: 5 },
		{ codes: ['Digit9'], label: '9', semitone: 6 },
		{ codes: ['KeyO'], label: 'O', semitone: 7 },
		{ codes: ['Digit0'], label: '0', semitone: 8 },
		{ codes: ['KeyP'], label: 'P', semitone: 9 },
		{ codes: ['Equal', 'Minus', 'Backspace'], label: '=', semitone: 10 },
		{ codes: ['BracketLeft'], label: '[', semitone: 11 },
		{ codes: ['BracketRight'], label: ']', semitone: 12 },
		{ codes: ['KeyF'], label: 'F', semitone: 13 },
		{ codes: ['KeyV'], label: 'V', semitone: 14 },
		{ codes: ['KeyG'], label: 'G', semitone: 15 },
		{ codes: ['KeyB'], label: 'B', semitone: 16 },
		{ codes: ['KeyN'], label: 'N', semitone: 17 },
		{ codes: ['KeyJ'], label: 'J', semitone: 18 },
		{ codes: ['KeyM'], label: 'M', semitone: 19 },
		{ codes: ['KeyK'], label: 'K', semitone: 20 },
		{ codes: ['Comma'], label: ',', semitone: 21 },
		{ codes: ['KeyL'], label: 'L', semitone: 22 },
		{ codes: ['Period'], label: '.', semitone: 23 }
	];

	const KEY_BY_CODE = new Map(PIANO_KEYS.flatMap((k) => k.codes.map((code) => [code, k] as const)));
	const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
	const BLACK_SEMITONES = new Set([1, 3, 6, 8, 10]);

	// Split the keys into white keys and black keys positioned by how many white keys precede them
	const whites: PianoKey[] = [];
	const blacks: { key: PianoKey; whitesBefore: number }[] = [];
	for (const key of PIANO_KEYS) {
		if (BLACK_SEMITONES.has((key.semitone + 12) % 12)) {
			blacks.push({ key, whitesBefore: whites.length });
		} else {
			whites.push(key);
		}
	}

	let isClosing = $state(false);
	let isVisible = $state(false);
	let transpose = $state(0);
	// With sustain on, released notes ring out and fade slowly instead of stopping right away
	let sustain = $state(false);
	const SUSTAIN_FADE_SECONDS = 2.5;
	const held = new SvelteMap<string, (fadeSeconds?: number) => void>();

	function noteName(semitone: number) {
		return NOTE_NAMES[(semitone + transpose + 24) % 12];
	}

	// Octave number shown on each C so the three octaves are easy to tell apart
	function octaveOf(semitone: number) {
		return Math.floor((60 + semitone + transpose) / 12) - 1;
	}

	// The on-screen key is lit while any of its physical keys (or the mouse) is holding it
	function isHeld(key: PianoKey) {
		return key.codes.some((code) => held.has(code));
	}

	function pressKey(code: string) {
		const key = KEY_BY_CODE.get(code);
		if (!key || held.has(code)) return;
		held.set(code, synth.startNote(midiToFreq(60 + key.semitone + transpose)));
	}

	function releaseKey(code: string) {
		const release = held.get(code);
		if (!release) return;
		release(sustain ? SUSTAIN_FADE_SECONDS : undefined);
		held.delete(code);
	}

	function releaseAll() {
		for (const release of held.values()) release();
		held.clear();
	}

	function setTranspose(value: number) {
		releaseAll();
		transpose = ((value % 12) + 12) % 12;
	}

	$effect(() => {
		if (pianoModal.open && !isVisible && !isClosing) {
			isVisible = true;
		} else if (!pianoModal.open && isVisible && !isClosing) {
			releaseAll();
			isClosing = true;
			setTimeout(() => {
				isClosing = false;
				isVisible = false;
			}, 180);
		}
	});

	const isLocked = $derived(isVisible || isClosing);
	$effect(() => {
		if (isLocked) {
			lockScroll();
			return () => {
				unlockScroll();
			};
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (!isVisible || isClosing) return;
		if (e.key === 'Escape') {
			handleClose();
			return;
		}
		if (e.ctrlKey || e.metaKey || e.altKey) return;

		if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
			e.preventDefault();
			setTranspose(transpose + (e.key === 'ArrowRight' ? 1 : -1));
			return;
		}

		if (!KEY_BY_CODE.has(e.code)) return;
		e.preventDefault();
		if (e.repeat) return;
		pressKey(e.code);
	}

	function handleKeyup(e: KeyboardEvent) {
		releaseKey(e.code);
	}

	function handleClose() {
		if (isClosing || !isVisible) return;
		releaseAll();
		isClosing = true;
		setTimeout(() => {
			isClosing = false;
			isVisible = false;
			closePianoModal();
		}, 180);
	}
</script>

<svelte:window onkeydown={handleKeydown} onkeyup={handleKeyup} onblur={releaseAll} />

{#if isVisible}
	<div
		role="dialog"
		aria-modal="true"
		aria-labelledby="piano-title"
		tabindex="-1"
		onclick={(e) => {
			if (e.target === e.currentTarget) handleClose();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') handleClose();
		}}
		class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain p-4 select-none"
	>
		<!--
			Blurred backdrop as a sibling layer (a blurred parent would stop the card's frosted glass
			from seeing the page). Clicks pass through to the dialog so clicking outside still closes
		-->
		<div
			aria-hidden="true"
			class="pointer-events-none fixed inset-0 bg-black/20 backdrop-blur-sm {isClosing
				? 'anim-modal-backdrop-out'
				: 'anim-modal-backdrop-in'}"
		></div>

		<!-- Modal Dialog Card -->
		<div
			class="relative flex w-full max-w-4xl flex-col items-center overflow-hidden rounded-none bg-surface/70 p-6 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.5)] backdrop-blur-lg will-change-transform sm:p-8 {isClosing
				? 'anim-modal-out'
				: 'anim-modal-in'}"
		>
			<!-- Volume (grows leftward from beside the close button) -->
			<div class="absolute top-4 right-14 z-10">
				<VolumeControl />
			</div>

			<!-- Close Button -->
			<button
				type="button"
				onclick={handleClose}
				aria-label="Close dialog"
				class="absolute top-4 right-4 cursor-pointer rounded-none p-1.5 text-muted transition-colors hover:bg-white/10 hover:text-white focus:outline-hidden"
			>
				<X class="size-5" />
			</button>

			<!-- Header Icon & Title -->
			<div class="mb-1 flex items-center gap-2 text-accent">
				<Piano class="size-5" />
				<h3
					id="piano-title"
					class="font-extrabold tracking-wide text-white {gameDevMode.active
						? 'font-pixel text-xs sm:text-sm'
						: 'font-sans text-lg sm:text-xl'}"
				>
					Duck Piano
				</h3>
			</div>

			<!-- Key (Transpose) Selector -->
			<div class="mt-3 mb-2 flex items-center gap-3">
				<button
					type="button"
					onclick={() => setTranspose(transpose - 1)}
					aria-label="Previous key"
					class="flex size-8 cursor-pointer items-center justify-center rounded-none border border-white/10 bg-white/5 text-muted transition-all hover:border-accent/40 hover:bg-accent/10 hover:text-white active:scale-95"
				>
					<ChevronLeft class="size-4" />
				</button>
				<span
					class="min-w-24 text-center font-bold text-muted {gameDevMode.active
						? 'text-[9px]'
						: 'text-sm'}"
				>
					Key:
					<span
						class="font-black text-accent {gameDevMode.active
							? 'font-pixel text-[11px]'
							: 'text-base'}"
					>
						{NOTE_NAMES[transpose]}
					</span>
				</span>
				<button
					type="button"
					onclick={() => setTranspose(transpose + 1)}
					aria-label="Next key"
					class="flex size-8 cursor-pointer items-center justify-center rounded-none border border-white/10 bg-white/5 text-muted transition-all hover:border-accent/40 hover:bg-accent/10 hover:text-white active:scale-95"
				>
					<ChevronRight class="size-4" />
				</button>
			</div>

			<div class="mb-3 flex flex-wrap justify-center gap-1">
				{#each NOTE_NAMES as name, i (name)}
					<button
						type="button"
						onclick={() => setTranspose(i)}
						aria-pressed={transpose === i}
						class="w-9 cursor-pointer rounded-none border py-1 font-bold transition-all active:scale-95 {gameDevMode.active
							? 'font-pixel text-[7px]'
							: 'text-[11px]'} {transpose === i
							? 'border-accent/60 bg-accent/25 text-accent'
							: 'border-white/8 bg-white/4 text-muted hover:border-accent/40 hover:text-white'}"
					>
						{name}
					</button>
				{/each}
			</div>

			<!-- Sustain Toggle -->
			<button
				type="button"
				onclick={() => (sustain = !sustain)}
				aria-pressed={sustain}
				class="mb-5 cursor-pointer rounded-none border px-3 py-1.5 font-bold transition-all active:scale-95 {gameDevMode.active
					? 'font-pixel text-[7px]'
					: 'text-xs'} {sustain
					? 'border-accent/60 bg-accent/25 text-accent'
					: 'border-white/10 bg-white/5 text-muted hover:border-accent/40 hover:text-white'}"
			>
				Sustain: {sustain ? 'On' : 'Off'}
			</button>

			<!-- Keyboard: three octaves (C3–B5) with each key's shortcut, like musicca.com/piano -->
			<div class="relative flex h-40 w-full">
				{#each whites as key (key.label)}
					{@const active = isHeld(key)}
					<button
						type="button"
						data-custom-sound
						tabindex="-1"
						aria-label="{noteName(key.semitone)}{octaveOf(key.semitone)} ({key.label})"
						onpointerdown={() => pressKey(key.codes[0])}
						onpointerup={() => releaseKey(key.codes[0])}
						onpointerleave={() => releaseKey(key.codes[0])}
						class="flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-end gap-1 rounded-b-md border border-black/40 pb-2 transition-colors duration-75 {active
							? 'bg-accent text-bg'
							: 'bg-white/90 text-bg/70 hover:bg-white'}"
					>
						<span class="font-black {gameDevMode.active ? 'font-pixel text-[7px]' : 'text-xs'}">
							{key.label}
						</span>
						<span
							class="font-bold opacity-60 {gameDevMode.active
								? 'font-pixel text-[5px]'
								: 'text-[9px]'}"
						>
							{noteName(key.semitone)}{noteName(key.semitone) === 'C' ? octaveOf(key.semitone) : ''}
						</span>
					</button>
				{/each}

				{#each blacks as { key, whitesBefore } (key.label)}
					{@const active = isHeld(key)}
					<button
						type="button"
						data-custom-sound
						tabindex="-1"
						aria-label="{noteName(key.semitone)}{octaveOf(key.semitone)} ({key.label})"
						onpointerdown={() => pressKey(key.codes[0])}
						onpointerup={() => releaseKey(key.codes[0])}
						onpointerleave={() => releaseKey(key.codes[0])}
						style="left: calc({(whitesBefore / whites.length) * 100}% - {32 /
							whites.length}%); width: {64 / whites.length}%;"
						class="absolute top-0 z-10 flex h-[60%] cursor-pointer items-end justify-center rounded-b-md border border-black/60 pb-1.5 transition-colors duration-75 {active
							? 'bg-accent text-bg'
							: 'bg-bg text-muted hover:bg-surface'}"
					>
						<span class="font-black {gameDevMode.active ? 'font-pixel text-[6px]' : 'text-[10px]'}">
							{key.label}
						</span>
					</button>
				{/each}
			</div>

			<!-- Footer Hint -->
			<p
				class="mt-5 text-center text-muted/70 {gameDevMode.active
					? 'text-[8px] leading-loose'
					: 'text-xs'}"
			>
				Z–R low octave · T–] middle · F–. high · ← → change key
			</p>
		</div>
	</div>
{/if}
