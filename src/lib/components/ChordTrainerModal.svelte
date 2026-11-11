<script lang="ts">
	import { Heart, Music, Play, RotateCcw, Trophy, Undo2, X } from '@lucide/svelte';
	import { gameDevMode, chordModal, closeChordModal } from '$lib/game-mode.svelte';
	import { synth, midiToFreq } from '$lib/synth.svelte';
	import { lockScroll, unlockScroll } from '$lib/scroll-lock';

	interface Degree {
		num: number; // scale degree 1–7
		roman: string;
		quality: '' | 'm' | 'dim';
		intervals: number[]; // chord tones in semitones above the key's tonic
	}

	// Diatonic triads of the major scale
	const DEGREES: Degree[] = [
		{ num: 1, roman: 'I', quality: '', intervals: [0, 4, 7] },
		{ num: 2, roman: 'ii', quality: 'm', intervals: [2, 5, 9] },
		{ num: 3, roman: 'iii', quality: 'm', intervals: [4, 7, 11] },
		{ num: 4, roman: 'IV', quality: '', intervals: [5, 9, 12] },
		{ num: 5, roman: 'V', quality: '', intervals: [7, 11, 14] },
		{ num: 6, roman: 'vi', quality: 'm', intervals: [9, 12, 16] },
		{ num: 7, roman: 'vii°', quality: 'dim', intervals: [11, 14, 17] }
	];

	const NOTE_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
	const PROGRESSION_LENGTH = 4; // the first chord is always the tonic, the rest are guessed
	const GUESSES = PROGRESSION_LENGTH - 1;
	const MAX_LIVES = 3;
	const CHORD_SECONDS = 0.95;
	const CHORD_GAP_SECONDS = 0.15;
	const REVEAL_MS = 1600;
	const SLOTS = Array.from({ length: PROGRESSION_LENGTH }, (_, i) => i);
	const LIFE_SLOTS = Array.from({ length: MAX_LIVES }, (_, i) => i);

	type Phase = 'idle' | 'round' | 'reveal' | 'over';

	let isClosing = $state(false);
	let isVisible = $state(false);
	let phase = $state<Phase>('idle');
	let includeSeventh = $state(false);
	let key = $state(0); // tonic pitch class of the current round
	let progression = $state<number[]>([]); // degree numbers, progression[0] === 1
	let guesses = $state<number[]>([]);
	let score = $state(0);
	let lives = $state(MAX_LIVES);
	let lastCorrect = $state(false);
	let playingIndex = $state<number | null>(null);
	let isNewBest = $state(false);
	let best = $state({ triads: 0, seventh: 0 });

	const pool = $derived(DEGREES.filter((d) => includeSeventh || d.num !== 7));
	const modeKey = $derived(includeSeventh ? 'seventh' : 'triads');
	const bestScore = $derived(best[modeKey]);

	const STORAGE_KEY = 'dookfolio:chord-trainer-best';

	function loadBest() {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return;
			const parsed = JSON.parse(raw);
			best = {
				triads: Number(parsed?.triads) || 0,
				seventh: Number(parsed?.seventh) || 0
			};
		} catch {
			// Storage can be blocked (private mode); the high score just won't persist
		}
	}

	function saveBest() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(best));
		} catch {
			// ignore
		}
	}

	function degree(num: number) {
		return DEGREES[num - 1];
	}

	function chordName(num: number) {
		const d = degree(num);
		const root = NOTE_NAMES[(key + d.intervals[0]) % 12];
		return d.quality === 'dim' ? `${root}°` : `${root}${d.quality}`;
	}

	// ---- Audio ----

	let timers: ReturnType<typeof setTimeout>[] = [];
	let releases: (() => void)[] = [];

	function stopAudio() {
		for (const t of timers) clearTimeout(t);
		timers = [];
		for (const release of releases) release();
		releases = [];
		playingIndex = null;
	}

	// Root-position triad starting from the root in octave 4, exactly the keys you'd press on
	// the Duck Piano (e.g. D major = D4, F#4, A4)
	function chordMidi(num: number): number[] {
		const d = degree(num);
		const root = 60 + ((key + d.intervals[0]) % 12);
		return d.intervals.map((iv) => root + iv - d.intervals[0]);
	}

	// Same notes and tone as the piano modal: press every key of the chord, let go after `seconds`
	function playChord(num: number, seconds: number) {
		const notes = chordMidi(num).map((m) => synth.startNote(midiToFreq(m)));
		const stop = () => {
			for (const release of notes) release();
		};
		releases.push(stop);
		timers.push(
			setTimeout(() => {
				stop();
				releases = releases.filter((r) => r !== stop);
			}, seconds * 1000)
		);
	}

	function playProgression() {
		stopAudio();
		const step = CHORD_SECONDS + CHORD_GAP_SECONDS;
		progression.forEach((num, i) => {
			timers.push(
				setTimeout(
					() => {
						playingIndex = i;
						playChord(num, CHORD_SECONDS);
					},
					i * step * 1000
				)
			);
		});
		timers.push(setTimeout(() => (playingIndex = null), progression.length * step * 1000));
	}

	function playSingle(num: number) {
		stopAudio();
		playChord(num, CHORD_SECONDS);
	}

	// Replay just one chord of the progression (e.g. tap the 2nd box to hear the 2nd chord alone)
	function playSlot(i: number) {
		const num = progression[i];
		if (num === undefined) return;
		stopAudio();
		playingIndex = i;
		playChord(num, CHORD_SECONDS);
		timers.push(setTimeout(() => (playingIndex = null), CHORD_SECONDS * 1000));
	}

	// ---- Game flow ----

	function newRound() {
		key = Math.floor(Math.random() * 12);
		const nums = pool.map((d) => d.num);
		progression = [1];
		for (let i = 0; i < GUESSES; i++) {
			progression.push(nums[Math.floor(Math.random() * nums.length)]);
		}
		guesses = [];
		phase = 'round';
		playProgression();
	}

	function startGame() {
		score = 0;
		lives = MAX_LIVES;
		isNewBest = false;
		newRound();
	}

	function guess(num: number) {
		if (phase !== 'round' || guesses.length >= GUESSES) return;
		if (!pool.some((d) => d.num === num)) return;
		guesses = [...guesses, num];
		if (guesses.length === GUESSES) checkAnswer();
	}

	function undo() {
		if (phase !== 'round') return;
		guesses = guesses.slice(0, -1);
	}

	function checkAnswer() {
		lastCorrect = guesses.every((g, i) => g === progression[i + 1]);
		if (lastCorrect) {
			score += 1;
			if (score > best[modeKey]) {
				best = { ...best, [modeKey]: score };
				isNewBest = true;
				saveBest();
			}
		} else {
			lives -= 1;
		}
		phase = 'reveal';
		// Kept apart from the audio timers so replaying a chord during the reveal can't cancel it
		clearAdvance();
		advanceTimer = setTimeout(
			() => {
				advanceTimer = null;
				if (lives <= 0) {
					stopAudio();
					phase = 'over';
				} else {
					newRound();
				}
			},
			REVEAL_MS + (lastCorrect ? 0 : 900)
		);
	}

	let advanceTimer: ReturnType<typeof setTimeout> | null = null;

	function clearAdvance() {
		if (advanceTimer) clearTimeout(advanceTimer);
		advanceTimer = null;
	}

	function slotState(i: number): 'empty' | 'filled' | 'right' | 'wrong' {
		const g = guesses[i];
		if (g === undefined) return 'empty';
		if (phase !== 'reveal') return 'filled';
		return g === progression[i + 1] ? 'right' : 'wrong';
	}

	// ---- Modal lifecycle ----

	$effect(() => {
		if (chordModal.open && !isVisible && !isClosing) {
			loadBest();
			isVisible = true;
		} else if (!chordModal.open && isVisible && !isClosing) {
			reset();
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

	function reset() {
		clearAdvance();
		stopAudio();
		phase = 'idle';
		guesses = [];
		progression = [];
	}

	function handleClose() {
		if (isClosing || !isVisible) return;
		reset();
		isClosing = true;
		setTimeout(() => {
			isClosing = false;
			isVisible = false;
			closeChordModal();
		}, 180);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!isVisible || isClosing) return;
		if (e.key === 'Escape') {
			handleClose();
			return;
		}
		if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;

		if (phase === 'idle' || phase === 'over') {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				startGame();
			}
			return;
		}
		if (phase !== 'round') return;

		if (/^[1-7]$/.test(e.key)) {
			e.preventDefault();
			guess(Number(e.key));
		} else if (e.key === 'Backspace') {
			e.preventDefault();
			undo();
		} else if (e.key === ' ' || e.key.toLowerCase() === 'r') {
			e.preventDefault();
			playProgression();
		}
	}

	const pixel = $derived(gameDevMode.active);
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isVisible}
	<div
		role="dialog"
		aria-modal="true"
		aria-labelledby="chord-title"
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
		<div
			class="relative my-auto flex w-full max-w-lg flex-col items-center overflow-hidden rounded-3xl border border-accent/30 bg-surface/95 p-5 shadow-2xl shadow-accent/20 backdrop-blur-md will-change-transform sm:p-8 {isClosing
				? 'anim-modal-out'
				: 'anim-modal-in'}"
		>
			<button
				type="button"
				onclick={handleClose}
				aria-label="Close dialog"
				class="absolute top-4 right-4 cursor-pointer rounded-xl p-1.5 text-muted transition-colors hover:bg-white/10 hover:text-white focus:outline-hidden"
			>
				<X class="size-5" />
			</button>

			<!-- Header -->
			<div class="mb-1 flex items-center gap-2 text-accent">
				<Music class="size-5" />
				<h3
					id="chord-title"
					class="font-extrabold tracking-wide text-white {pixel
						? 'font-pixel text-xs sm:text-sm'
						: 'font-sans text-lg sm:text-xl'}"
				>
					Guess the Chords
				</h3>
			</div>
			<p class="mb-4 text-center text-muted {pixel ? 'text-[8px] leading-loose' : 'text-xs'}">
				Four chords play. The first is always the tonic (I). Name the other three. Tap a box to hear
				that chord alone.
			</p>

			<!-- Score bar -->
			<div
				class="mb-4 flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/4 px-4 py-2 {pixel
					? 'font-pixel text-[8px]'
					: 'text-sm'}"
			>
				<span class="font-bold text-muted">
					Score <span class="font-black text-white">{score}</span>
				</span>
				<span class="flex gap-1" aria-label="{lives} lives left">
					{#each LIFE_SLOTS as i (i)}
						<Heart class="size-4 {i < lives ? 'fill-accent text-accent' : 'text-white/20'}" />
					{/each}
				</span>
				<span class="flex items-center gap-1 font-bold text-muted">
					<Trophy class="size-3.5 text-accent" />
					<span class="font-black text-white">{bestScore}</span>
				</span>
			</div>

			{#if phase === 'idle' || phase === 'over'}
				<!-- Start / Game over screen -->
				<div class="flex w-full flex-col items-center gap-4 py-2">
					{#if phase === 'over'}
						<div class="text-center">
							<p class="font-black text-white {pixel ? 'font-pixel text-sm' : 'text-2xl'}">
								Game over
							</p>
							<p class="mt-1 text-muted {pixel ? 'text-[8px] leading-loose' : 'text-sm'}">
								You got {score} progression{score === 1 ? '' : 's'} right{isNewBest
									? ' · new high score!'
									: ''}
							</p>
						</div>
					{/if}

					<div class="flex flex-col items-center gap-1.5">
						<span class="font-bold text-muted {pixel ? 'text-[7px]' : 'text-[11px]'}">
							Chord pool
						</span>
						<div class="flex rounded-xl border border-white/10 bg-white/5 p-1">
							{#each [false, true] as withSeventh (withSeventh)}
								<button
									type="button"
									onclick={() => (includeSeventh = withSeventh)}
									aria-pressed={includeSeventh === withSeventh}
									class="cursor-pointer rounded-lg px-3 py-1.5 font-bold transition-all active:scale-95 {pixel
										? 'font-pixel text-[7px]'
										: 'text-xs'} {includeSeventh === withSeventh
										? 'bg-accent/25 text-accent'
										: 'text-muted hover:text-white'}"
								>
									{withSeventh ? 'I – vii°' : 'I – vi'}
								</button>
							{/each}
						</div>
						<span class="text-muted/70 {pixel ? 'text-[6px]' : 'text-[10px]'}">
							Each pool keeps its own high score
						</span>
					</div>

					<button
						type="button"
						data-custom-sound
						onclick={startGame}
						class="flex cursor-pointer items-center gap-2 rounded-2xl border border-accent/60 bg-accent/25 px-6 py-3 font-black text-accent transition-all hover:bg-accent/35 active:scale-95 {pixel
							? 'font-pixel text-[9px]'
							: 'text-base'}"
					>
						{#if phase === 'over'}
							<RotateCcw class="size-4" /> Play again
						{:else}
							<Play class="size-4" /> Start
						{/if}
					</button>
				</div>
			{:else}
				<!-- Progression slots -->
				<div class="mb-2 font-bold text-muted {pixel ? 'text-[7px]' : 'text-xs'}">
					Key of <span class="text-accent">{NOTE_NAMES[key]} major</span>
				</div>
				<div class="mb-4 grid w-full grid-cols-4 gap-2">
					{#each SLOTS as i (i)}
						{@const state = i === 0 ? 'tonic' : slotState(i - 1)}
						{@const shown = i === 0 ? 1 : guesses[i - 1]}
						<button
							type="button"
							data-custom-sound
							onclick={() => playSlot(i)}
							aria-label="Play chord {i + 1} alone"
							class="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 transition-all duration-150 hover:border-accent/60 active:scale-95 {playingIndex ===
							i
								? 'scale-105 border-accent bg-accent/20'
								: state === 'right'
									? 'border-emerald-400/70 bg-emerald-400/15'
									: state === 'wrong'
										? 'border-rose-400/70 bg-rose-400/15'
										: state === 'empty'
											? 'border-dashed border-white/15 bg-white/3'
											: 'border-white/15 bg-white/8'}"
						>
							<span
								class="font-black text-white {pixel
									? 'font-pixel text-[10px]'
									: 'text-xl sm:text-2xl'}"
							>
								{shown !== undefined ? degree(shown).roman : '?'}
							</span>
							{#if phase === 'reveal' && i > 0 && state === 'wrong'}
								<span
									class="mt-0.5 font-bold text-emerald-300 {pixel
										? 'font-pixel text-[6px]'
										: 'text-[11px]'}"
								>
									{degree(progression[i]).roman}
								</span>
							{:else if shown !== undefined && (i === 0 || phase === 'reveal')}
								<span class="mt-0.5 font-bold text-muted {pixel ? 'text-[6px]' : 'text-[10px]'}">
									{chordName(shown)}
								</span>
							{/if}
						</button>
					{/each}
				</div>

				<!-- Feedback / controls -->
				<div class="mb-4 flex h-9 items-center justify-center gap-2">
					{#if phase === 'reveal'}
						<span
							class="font-black {lastCorrect ? 'text-emerald-300' : 'text-rose-300'} {pixel
								? 'font-pixel text-[9px]'
								: 'text-base'}"
						>
							{lastCorrect ? 'Correct! +1' : 'Not quite · −1 life'}
						</span>
					{:else}
						<button
							type="button"
							data-custom-sound
							onclick={playProgression}
							class="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-bold text-muted transition-all hover:border-accent/40 hover:text-white active:scale-95 {pixel
								? 'font-pixel text-[7px]'
								: 'text-xs'}"
						>
							<Play class="size-3.5" /> Replay
						</button>
						<button
							type="button"
							onclick={undo}
							disabled={guesses.length === 0}
							class="flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-bold text-muted transition-all hover:border-accent/40 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 {pixel
								? 'font-pixel text-[7px]'
								: 'text-xs'}"
						>
							<Undo2 class="size-3.5" /> Undo
						</button>
					{/if}
				</div>

				<!-- Answer pad -->
				<div class="grid w-full gap-2 {pool.length === 7 ? 'grid-cols-4' : 'grid-cols-3'}">
					{#each pool as d (d.num)}
						<button
							type="button"
							data-custom-sound
							onclick={() => guess(d.num)}
							disabled={phase !== 'round'}
							class="relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-3 transition-all hover:border-accent/50 hover:bg-accent/15 active:scale-95 disabled:cursor-default disabled:opacity-50 disabled:hover:border-white/10 disabled:hover:bg-white/5 sm:py-4"
						>
							<!-- Scale degree (also the keyboard shortcut) -->
							<span
								class="absolute top-1.5 left-2 font-bold text-muted/70 {pixel
									? 'font-pixel text-[5px]'
									: 'text-[9px]'}"
							>
								{d.num}
							</span>
							<span class="font-black text-white {pixel ? 'font-pixel text-[10px]' : 'text-lg'}">
								{d.roman}
							</span>
							<span class="font-bold text-accent {pixel ? 'font-pixel text-[6px]' : 'text-[11px]'}">
								{chordName(d.num)}
							</span>
						</button>
					{/each}
				</div>

				<!-- Hear a single chord in this key to compare -->
				<div class="mt-3 flex flex-wrap items-center justify-center gap-1">
					<span class="mr-1 text-muted/70 {pixel ? 'text-[6px]' : 'text-[10px]'}">Hear:</span>
					{#each pool as d (d.num)}
						<button
							type="button"
							data-custom-sound
							onclick={() => playSingle(d.num)}
							disabled={phase !== 'round'}
							class="cursor-pointer rounded-lg border border-white/8 bg-white/4 px-2 py-1 font-bold text-muted transition-all hover:border-accent/40 hover:text-white active:scale-95 disabled:opacity-40 {pixel
								? 'font-pixel text-[6px]'
								: 'text-[10px]'}"
						>
							{d.roman}
						</button>
					{/each}
				</div>
			{/if}

			<p
				class="mt-5 hidden text-center text-muted/70 md:block {pixel
					? 'text-[8px] leading-loose'
					: 'text-xs'}"
			>
				1–{pool.length} answer · Backspace undo · Space replay · Enter start
			</p>
		</div>
	</div>
{/if}
