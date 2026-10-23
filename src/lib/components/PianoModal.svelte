<script lang="ts">
	import { ChevronLeft, ChevronRight, Piano, X } from '@lucide/svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { gameDevMode, pianoModal, closePianoModal } from '$lib/game-mode.svelte';
	import { synth, midiToFreq } from '$lib/synth.svelte';
	import { lockScroll, unlockScroll } from '$lib/scroll-lock';

	interface PianoKey {
		code: string;
		label: string;
		semitone: number; // relative to C4 (MIDI 60)
	}

	// Four-row tracker layout (FL Studio / Renoise / FastTracker), mapped by physical key position
	const LOWER_ROW: PianoKey[] = [
		{ code: 'KeyZ', label: 'Z', semitone: 0 },
		{ code: 'KeyS', label: 'S', semitone: 1 },
		{ code: 'KeyX', label: 'X', semitone: 2 },
		{ code: 'KeyD', label: 'D', semitone: 3 },
		{ code: 'KeyC', label: 'C', semitone: 4 },
		{ code: 'KeyV', label: 'V', semitone: 5 },
		{ code: 'KeyG', label: 'G', semitone: 6 },
		{ code: 'KeyB', label: 'B', semitone: 7 },
		{ code: 'KeyH', label: 'H', semitone: 8 },
		{ code: 'KeyN', label: 'N', semitone: 9 },
		{ code: 'KeyJ', label: 'J', semitone: 10 },
		{ code: 'KeyM', label: 'M', semitone: 11 }
	];

	const UPPER_ROW: PianoKey[] = [
		{ code: 'KeyQ', label: 'Q', semitone: 12 },
		{ code: 'Digit2', label: '2', semitone: 13 },
		{ code: 'KeyW', label: 'W', semitone: 14 },
		{ code: 'Digit3', label: '3', semitone: 15 },
		{ code: 'KeyE', label: 'E', semitone: 16 },
		{ code: 'KeyR', label: 'R', semitone: 17 },
		{ code: 'Digit5', label: '5', semitone: 18 },
		{ code: 'KeyT', label: 'T', semitone: 19 },
		{ code: 'Digit6', label: '6', semitone: 20 },
		{ code: 'KeyY', label: 'Y', semitone: 21 },
		{ code: 'Digit7', label: '7', semitone: 22 },
		{ code: 'KeyU', label: 'U', semitone: 23 },
		{ code: 'KeyI', label: 'I', semitone: 24 },
		{ code: 'Digit9', label: '9', semitone: 25 },
		{ code: 'KeyO', label: 'O', semitone: 26 },
		{ code: 'Digit0', label: '0', semitone: 27 },
		{ code: 'KeyP', label: 'P', semitone: 28 },
		{ code: 'BracketLeft', label: '[', semitone: 29 },
		{ code: 'Equal', label: '=', semitone: 30 },
		{ code: 'BracketRight', label: ']', semitone: 31 }
	];

	const KEY_BY_CODE = new Map([...LOWER_ROW, ...UPPER_ROW].map((k) => [k.code, k]));
	const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
	const BLACK_SEMITONES = new Set([1, 3, 6, 8, 10]);

	// Split a row into white keys and black keys positioned by how many white keys precede them
	function splitRow(row: PianoKey[]) {
		const whites: PianoKey[] = [];
		const blacks: { key: PianoKey; whitesBefore: number }[] = [];
		for (const key of row) {
			if (BLACK_SEMITONES.has(key.semitone % 12)) {
				blacks.push({ key, whitesBefore: whites.length });
			} else {
				whites.push(key);
			}
		}
		return { whites, blacks };
	}

	const rows = [
		{ id: 'upper', ...splitRow(UPPER_ROW) },
		{ id: 'lower', ...splitRow(LOWER_ROW) }
	];

	let isClosing = $state(false);
	let isVisible = $state(false);
	let transpose = $state(0);
	const held = new SvelteMap<string, () => void>();

	function noteName(semitone: number) {
		return NOTE_NAMES[(semitone + transpose) % 12];
	}

	function pressKey(code: string) {
		const key = KEY_BY_CODE.get(code);
		if (!key || held.has(code)) return;
		held.set(code, synth.startNote(midiToFreq(60 + key.semitone + transpose)));
	}

	function releaseKey(code: string) {
		const release = held.get(code);
		if (!release) return;
		release();
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
		class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-black/80 p-4 backdrop-blur-md select-none {isClosing
			? 'anim-modal-backdrop-out'
			: 'anim-modal-backdrop-in'}"
	>
		<!-- Modal Dialog Card -->
		<div
			class="relative flex w-full max-w-3xl flex-col items-center overflow-hidden rounded-3xl border border-accent/30 bg-surface/95 p-6 shadow-2xl shadow-accent/20 backdrop-blur-md will-change-transform sm:p-8 {isClosing
				? 'anim-modal-out'
				: 'anim-modal-in'}"
		>
			<!-- Close Button -->
			<button
				type="button"
				onclick={handleClose}
				aria-label="Close dialog"
				class="absolute top-4 right-4 cursor-pointer rounded-xl p-1.5 text-muted transition-colors hover:bg-white/10 hover:text-white focus:outline-hidden"
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
					class="flex size-8 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 text-muted transition-all hover:border-accent/40 hover:bg-accent/10 hover:text-white active:scale-95"
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
					class="flex size-8 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 text-muted transition-all hover:border-accent/40 hover:bg-accent/10 hover:text-white active:scale-95"
				>
					<ChevronRight class="size-4" />
				</button>
			</div>

			<div class="mb-5 flex flex-wrap justify-center gap-1">
				{#each NOTE_NAMES as name, i (name)}
					<button
						type="button"
						onclick={() => setTranspose(i)}
						aria-pressed={transpose === i}
						class="w-9 cursor-pointer rounded-lg border py-1 font-bold transition-all active:scale-95 {gameDevMode.active
							? 'font-pixel text-[7px]'
							: 'text-[11px]'} {transpose === i
							? 'border-accent/60 bg-accent/25 text-accent'
							: 'border-white/8 bg-white/4 text-muted hover:border-accent/40 hover:text-white'}"
					>
						{name}
					</button>
				{/each}
			</div>

			<!-- Keyboard: upper row (Q–]) above lower row (Z–M), like the physical keyboard -->
			<div class="flex w-full flex-col gap-3">
				{#each rows as row (row.id)}
					<div class="relative flex h-32 w-full {row.id === 'lower' ? 'max-w-[58%]' : ''}">
						{#each row.whites as key (key.code)}
							{@const active = held.has(key.code)}
							<button
								type="button"
								data-custom-sound
								tabindex="-1"
								aria-label="{noteName(key.semitone)} ({key.label})"
								onpointerdown={() => pressKey(key.code)}
								onpointerup={() => releaseKey(key.code)}
								onpointerleave={() => releaseKey(key.code)}
								class="flex flex-1 cursor-pointer flex-col items-center justify-end gap-1 rounded-b-lg border border-black/40 pb-2 transition-colors duration-75 {active
									? 'bg-accent text-bg'
									: 'bg-white/90 text-bg/70 hover:bg-white'}"
							>
								<span class="font-black {gameDevMode.active ? 'font-pixel text-[8px]' : 'text-xs'}">
									{key.label}
								</span>
								<span
									class="font-bold opacity-60 {gameDevMode.active
										? 'font-pixel text-[6px]'
										: 'text-[10px]'}"
								>
									{noteName(key.semitone)}
								</span>
							</button>
						{/each}

						{#each row.blacks as { key, whitesBefore } (key.code)}
							{@const active = held.has(key.code)}
							<button
								type="button"
								data-custom-sound
								tabindex="-1"
								aria-label="{noteName(key.semitone)} ({key.label})"
								onpointerdown={() => pressKey(key.code)}
								onpointerup={() => releaseKey(key.code)}
								onpointerleave={() => releaseKey(key.code)}
								style="left: calc({(whitesBefore / row.whites.length) * 100}% - {35 /
									row.whites.length}%); width: {70 / row.whites.length}%;"
								class="absolute top-0 z-10 flex h-[60%] cursor-pointer items-end justify-center rounded-b-md border border-black/60 pb-1.5 transition-colors duration-75 {active
									? 'bg-accent text-bg'
									: 'bg-bg text-muted hover:bg-surface'}"
							>
								<span
									class="font-black {gameDevMode.active ? 'font-pixel text-[7px]' : 'text-[10px]'}"
								>
									{key.label}
								</span>
							</button>
						{/each}
					</div>
				{/each}
			</div>

			<!-- Footer Hint -->
			<p
				class="mt-5 text-center text-muted/70 {gameDevMode.active
					? 'text-[8px] leading-loose'
					: 'text-xs'}"
			>
				Play with the Z–M and Q–] rows · S D G H J and the number keys are sharps · ← → change key
			</p>
		</div>
	</div>
{/if}
