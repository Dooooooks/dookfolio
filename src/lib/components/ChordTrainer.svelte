<script lang="ts">
	import { onDestroy, onMount, type Snippet } from 'svelte';
	import { Heart, Music, Play, RotateCcw, Trophy, Undo2 } from '@lucide/svelte';
	import { gameDevMode } from '$lib/game-mode.svelte';
	import { synth, midiToFreq } from '$lib/synth.svelte';

	interface Props {
		// Keyboard shortcuts only work while active (e.g. the modal is open and not closing)
		active?: boolean;
		// Extra buttons shown in the top-right corner (close, fullscreen…)
		actions?: Snippet;
		// Bigger layout for the standalone /chords page
		large?: boolean;
	}

	let { active = true, actions, large = false }: Props = $props();

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

	// Major keys by tonic pitch class, named the way they're usually written
	const KEY_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
	const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
	const LETTER_PCS = [0, 2, 4, 5, 7, 9, 11];

	// Spell a scale degree's root correctly for the key: each degree gets the next letter name,
	// so E major's iii is G#m (not Abm) and F major's IV is Bb (not A#)
	function spellDegree(num: number, pc: number) {
		const letter = (LETTERS.indexOf(KEY_NAMES[key][0]) + num - 1) % 7;
		const offset = ((((pc - LETTER_PCS[letter]) % 12) + 18) % 12) - 6;
		return LETTERS[letter] + (offset > 0 ? '#'.repeat(offset) : 'b'.repeat(-offset));
	}
	const PROGRESSION_LENGTH = 4; // the first chord is always the tonic, the rest are guessed
	const GUESSES = PROGRESSION_LENGTH - 1;
	const MAX_LIVES = 3;
	const CHORD_SECONDS = 0.95;
	const CHORD_GAP_SECONDS = 0.15;
	const REVEAL_MS = 1600;
	const SLOTS = Array.from({ length: PROGRESSION_LENGTH }, (_, i) => i);
	const LIFE_SLOTS = Array.from({ length: MAX_LIVES }, (_, i) => i);

	type Phase = 'idle' | 'round' | 'reveal' | 'over';

	let phase = $state<Phase>('idle');
	// Scale degrees in the random pool; any chord can be toggled, but at least MIN_POOL stay in
	const DEFAULT_POOL = [1, 2, 3, 4, 5, 6];
	const MIN_POOL = 2;
	let enabled = $state<number[]>([...DEFAULT_POOL]);
	let poolWarning = $state(false);
	let poolWarningTimer: ReturnType<typeof setTimeout> | null = null;
	let key = $state(0); // tonic pitch class of the current round
	let progression = $state<number[]>([]); // degree numbers, progression[0] === 1
	let guesses = $state<number[]>([]);
	let score = $state(0);
	let lives = $state(MAX_LIVES);
	let lastCorrect = $state(false);
	let playingIndex = $state<number | null>(null);
	let isNewBest = $state(false);
	let best = $state<Record<string, number>>({}); // high score per pool, keyed like "123456"

	const pool = $derived(DEGREES.filter((d) => enabled.includes(d.num)));
	const modeKey = $derived(pool.map((d) => d.num).join(''));
	const bestScore = $derived(best[modeKey] ?? 0);

	function togglePool(num: number) {
		if (enabled.includes(num)) {
			if (enabled.length <= MIN_POOL) {
				poolWarning = true;
				if (poolWarningTimer) clearTimeout(poolWarningTimer);
				poolWarningTimer = setTimeout(() => (poolWarning = false), 1600);
				return;
			}
			enabled = enabled.filter((n) => n !== num);
		} else {
			enabled = [...enabled, num].sort((a, b) => a - b);
		}
		savePool();
	}

	const STORAGE_KEY = 'dookfolio:chord-trainer-best';
	const POOL_KEY = 'dookfolio:chord-trainer-pool';

	function loadBest() {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw) as Record<string, unknown>;
				const next: Record<string, number> = {};
				for (const [k, v] of Object.entries(parsed ?? {})) {
					// Older saves used "triads" (I–vi) and "seventh" (I–vii°)
					const id = k === 'triads' ? '123456' : k === 'seventh' ? '1234567' : k;
					if (/^[1-7]+$/.test(id)) next[id] = Math.max(next[id] ?? 0, Number(v) || 0);
				}
				best = next;
			}
			const savedPool = JSON.parse(localStorage.getItem(POOL_KEY) ?? 'null');
			if (
				Array.isArray(savedPool) &&
				savedPool.length >= MIN_POOL &&
				savedPool.every((n) => Number.isInteger(n) && n >= 1 && n <= 7)
			) {
				enabled = [...new Set(savedPool as number[])].sort((a, b) => a - b);
			}
		} catch {
			// Storage can be blocked (private mode); the high score just won't persist
		}
	}

	function savePool() {
		try {
			localStorage.setItem(POOL_KEY, JSON.stringify(enabled));
		} catch {
			// ignore
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
		const root = spellDegree(num, (key + d.intervals[0]) % 12);
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
		catchCheater();
	}

	// ---- Dopamine hit for a correct progression ----

	interface Confetti {
		id: number;
		dx: number;
		dy: number;
		rot: number;
		delay: number;
		color: string;
		wide: boolean;
	}

	const CONFETTI_COLORS = ['#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#38bdf8', '#ffffff'];
	let streak = $state(0);
	let celebration = $state(0); // bumps per win so the effects re-play
	let confetti = $state<Confetti[]>([]);
	let confettiTimer: ReturnType<typeof setTimeout> | null = null;

	const winMessage = $derived(
		streak >= 10
			? `🎹 Chord wizard! x${streak}`
			: streak >= 5
				? `🔥 Unstoppable! x${streak}`
				: streak >= 3
					? `🔥 On fire! x${streak}`
					: streak === 2
						? 'Nice! 2 in a row'
						: 'Correct! +1'
	);

	function celebrate() {
		celebration += 1;

		// Confetti bursts up and out from the chord boxes; a longer streak throws more of it
		const count = Math.min(24 + streak * 4, 60);
		confetti = Array.from({ length: count }, (_, i) => {
			const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
			const power = 90 + Math.random() * 130;
			return {
				id: celebration * 1000 + i,
				dx: Math.cos(angle) * power,
				dy: Math.sin(angle) * power,
				rot: (Math.random() - 0.5) * 720,
				delay: Math.random() * 80,
				color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
				wide: Math.random() < 0.5
			};
		});
		if (confettiTimer) clearTimeout(confettiTimer);
		confettiTimer = setTimeout(() => (confetti = []), 1300);

		playWinJingle();
	}

	// Quick rising arpeggio up the tonic chord, landing on the octave (same piano voice)
	function playWinJingle() {
		stopAudio();
		const root = 60 + key;
		const notes = [root, root + 4, root + 7, root + 12];
		// Each streak level nudges the jingle up a step for extra "ding"
		const lift = Math.min(streak - 1, 4) * 2;
		notes.forEach((m, i) => {
			timers.push(
				setTimeout(() => {
					const release = synth.startNote(midiToFreq(m + lift));
					const last = i === notes.length - 1;
					timers.push(setTimeout(() => release(last ? 0.6 : 0.12), last ? 260 : 90));
				}, i * 75)
			);
		});
	}

	// ---- Easter egg: using the Hear buttons mid-round gets you called out ----

	const CHEATER_LINES = [
		'Cheater! 👀',
		'The duck saw that 🦆',
		'No peeking!',
		'Quack… cheater',
		'Ears, not buttons!',
		'I’m telling your teacher',
		'Bold move, cheater'
	];
	let cheatLine = $state<string | null>(null);
	let cheatCount = $state(0); // bumps on every press so the bubble re-pops
	let cheatedThisRound = $state(false);
	let cheatTimer: ReturnType<typeof setTimeout> | null = null;

	function catchCheater() {
		if (phase !== 'round') return;
		cheatedThisRound = true;
		cheatCount += 1;
		cheatLine =
			cheatCount === 1
				? CHEATER_LINES[0]
				: CHEATER_LINES[Math.floor(Math.random() * CHEATER_LINES.length)];
		if (cheatTimer) clearTimeout(cheatTimer);
		cheatTimer = setTimeout(() => (cheatLine = null), 1400);
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
		cheatedThisRound = false;
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
		streak = 0;
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
			streak += 1;
			celebrate();
			if (score > (best[modeKey] ?? 0)) {
				best = { ...best, [modeKey]: score };
				isNewBest = true;
				saveBest();
			}
		} else {
			lives -= 1;
			streak = 0;
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

	// ---- Lifecycle ----

	onMount(loadBest);
	onDestroy(reset);

	// Stop the music and go back to the start screen when the host deactivates the game
	$effect(() => {
		if (!active) reset();
	});

	function reset() {
		clearAdvance();
		stopAudio();
		if (cheatTimer) clearTimeout(cheatTimer);
		cheatLine = null;
		cheatCount = 0;
		if (confettiTimer) clearTimeout(confettiTimer);
		confetti = [];
		streak = 0;
		phase = 'idle';
		guesses = [];
		progression = [];
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!active) return;
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

<div class="relative flex w-full flex-col items-center {large ? 'max-w-xl' : ''}">
	{#if actions}
		<div class="absolute -top-1 -right-1 flex items-center gap-1 sm:-top-3 sm:-right-3">
			{@render actions()}
		</div>
	{/if}

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

	<!-- Stats: three floating columns (label over a big number), split by thin dividers -->
	<div class="mb-5 grid w-full grid-cols-[1fr_auto_1fr_auto_1fr] items-center">
		<div class="relative flex flex-col items-center gap-1">
			<!-- "+1" floats up out of the score on every win -->
			{#if celebration > 0 && phase === 'reveal' && lastCorrect}
				{#key celebration}
					<span
						aria-hidden="true"
						class="plus-one pointer-events-none absolute top-4 right-1/2 -mr-10 font-black text-emerald-300 {pixel
							? 'font-pixel text-[10px]'
							: 'text-lg'}"
					>
						+1
					</span>
				{/key}
			{/if}
			<span
				class="font-bold tracking-[0.2em] text-muted/70 uppercase {pixel
					? 'text-[6px]'
					: 'text-[10px]'}"
			>
				Score
			</span>
			{#key score}
				<span
					class="font-black text-white tabular-nums {score > 0 ? 'score-pop' : ''} {pixel
						? 'font-pixel text-base'
						: 'text-3xl'}"
				>
					{score}
				</span>
			{/key}
		</div>

		<span aria-hidden="true" class="h-9 w-px bg-white/10"></span>

		<div class="flex flex-col items-center gap-1">
			<span
				class="font-bold tracking-[0.2em] text-muted/70 uppercase {pixel
					? 'text-[6px]'
					: 'text-[10px]'}"
			>
				Lives
			</span>
			<span class="flex h-9 items-center gap-1.5" aria-label="{lives} lives left">
				{#each LIFE_SLOTS as i (i)}
					<!-- Re-mount the heart that was just lost so its shake plays -->
					{#key i === lives ? lives : -1}
						<span class="inline-flex {i === lives ? 'heart-shake' : ''}">
							<Heart
								class="size-5 transition-colors duration-300 {i < lives
									? 'fill-accent text-accent'
									: 'text-white/15'}"
							/>
						</span>
					{/key}
				{/each}
			</span>
		</div>

		<span aria-hidden="true" class="h-9 w-px bg-white/10"></span>

		<div class="flex flex-col items-center gap-1">
			<span
				class="flex items-center gap-1 font-bold tracking-[0.2em] text-muted/70 uppercase {pixel
					? 'text-[6px]'
					: 'text-[10px]'}"
			>
				<Trophy class="size-3 text-accent/80" /> Best
			</span>
			{#key bestScore}
				<span
					class="font-black tabular-nums {isNewBest ? 'score-pop text-accent' : 'text-white'} {pixel
						? 'font-pixel text-base'
						: 'text-3xl'}"
				>
					{bestScore}
				</span>
			{/key}
		</div>
	</div>

	{#if phase === 'idle' || phase === 'over'}
		<!-- Start / Game over screen -->
		<div class="flex w-full flex-col items-center gap-4 py-2">
			{#if phase === 'over'}
				<div class="text-center">
					<p class="font-black text-white {pixel ? 'font-pixel text-sm' : 'text-2xl'}">Game over</p>
					<p class="mt-1 text-muted {pixel ? 'text-[8px] leading-loose' : 'text-sm'}">
						You got {score} progression{score === 1 ? '' : 's'} right{isNewBest
							? ' · new high score!'
							: ''}
					</p>
				</div>
			{/if}

			<!-- Chord pool: I–vi are always in; vii° is a chip you tap to add or remove -->
			<div class="flex flex-col items-center gap-2">
				<span
					class="font-bold tracking-[0.2em] text-muted/70 uppercase {pixel
						? 'text-[6px]'
						: 'text-[10px]'}"
				>
					Chord pool
				</span>
				<div class="flex flex-wrap items-center justify-center gap-1.5">
					{#each DEGREES as d (d.num)}
						{@const on = enabled.includes(d.num)}
						<button
							type="button"
							onclick={() => togglePool(d.num)}
							aria-pressed={on}
							aria-label="{on ? 'Remove' : 'Add'} {d.roman} {on ? 'from' : 'to'} the pool"
							title="{on ? 'Remove' : 'Add'} {d.roman}"
							class="flex h-9 min-w-11 cursor-pointer items-center justify-center gap-0.5 rounded-none border px-2 font-black transition-all active:scale-95 {pixel
								? 'font-pixel text-[7px]'
								: 'text-sm'} {on
								? 'border-accent/50 bg-accent/20 text-white hover:bg-accent/30'
								: 'border-dashed border-white/20 text-muted/60 hover:border-accent/50 hover:text-white'}"
						>
							{#if !on}<span class="font-bold opacity-70">+</span>{/if}
							{d.roman}
						</button>
					{/each}
				</div>
				<span
					class="{poolWarning ? 'text-rose-300' : 'text-muted/70'} {pixel
						? 'text-[6px]'
						: 'text-[10px]'}"
				>
					{poolWarning
						? `Keep at least ${MIN_POOL} chords in the pool`
						: 'Tap a chord to add or remove it · each mix keeps its own high score'}
				</span>
			</div>

			<button
				type="button"
				data-custom-sound
				onclick={startGame}
				class="flex cursor-pointer items-center gap-2 rounded-none border border-accent/60 bg-accent/25 px-6 py-3 font-black text-accent transition-all hover:bg-accent/35 active:scale-95 {pixel
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
			Key of <span class="text-accent">{KEY_NAMES[key]} major</span>
		</div>
		<div class="relative mb-4 grid w-full grid-cols-4 gap-2">
			<!-- Confetti burst on a correct progression -->
			{#if confetti.length}
				<div aria-hidden="true" class="pointer-events-none absolute inset-0 z-20 overflow-visible">
					{#each confetti as c (c.id)}
						<span
							class="confetti absolute top-1/2 left-1/2"
							style="--dx: {c.dx}px; --dy: {c.dy}px; --rot: {c.rot}deg; animation-delay: {c.delay}ms; background: {c.color}; width: {c.wide
								? 9
								: 5}px; height: {c.wide ? 5 : 9}px;"
						></span>
					{/each}
				</div>
			{/if}
			{#each SLOTS as i (i)}
				{@const state = i === 0 ? 'tonic' : slotState(i - 1)}
				{@const shown = i === 0 ? 1 : guesses[i - 1]}
				<button
					type="button"
					data-custom-sound
					onclick={() => playSlot(i)}
					aria-label="Play chord {i + 1} alone"
					style={phase === 'reveal' && lastCorrect ? `animation-delay: ${i * 70}ms` : ''}
					class="{phase === 'reveal' && lastCorrect
						? 'slot-win'
						: ''} flex aspect-square cursor-pointer flex-col items-center justify-center rounded-none border-2 transition-all duration-150 hover:border-accent/60 active:scale-95 {playingIndex ===
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
						class="font-black text-white {pixel ? 'font-pixel text-[10px]' : 'text-xl sm:text-2xl'}"
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
					class="font-black {lastCorrect ? 'win-text text-emerald-300' : 'text-rose-300'} {pixel
						? 'font-pixel text-[9px]'
						: 'text-base'}"
				>
					{lastCorrect
						? cheatedThisRound
							? 'Correct… cheater 👀 +1'
							: winMessage
						: cheatedThisRound
							? 'Cheated and still missed 💀'
							: 'Not quite · −1 life'}
				</span>
			{:else}
				<button
					type="button"
					data-custom-sound
					onclick={playProgression}
					class="flex cursor-pointer items-center gap-1.5 rounded-none border border-white/10 bg-white/5 px-3 py-2 font-bold text-muted transition-all hover:border-accent/40 hover:text-white active:scale-95 {pixel
						? 'font-pixel text-[7px]'
						: 'text-xs'}"
				>
					<Play class="size-3.5" /> Replay
				</button>
				<button
					type="button"
					onclick={undo}
					disabled={guesses.length === 0}
					class="flex cursor-pointer items-center gap-1.5 rounded-none border border-white/10 bg-white/5 px-3 py-2 font-bold text-muted transition-all hover:border-accent/40 hover:text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 {pixel
						? 'font-pixel text-[7px]'
						: 'text-xs'}"
				>
					<Undo2 class="size-3.5" /> Undo
				</button>
			{/if}
		</div>

		<!-- Answer pad -->
		<div
			class="grid w-full gap-2 {pool.length === 2
				? 'grid-cols-2'
				: pool.length === 4 || pool.length === 7
					? 'grid-cols-4'
					: 'grid-cols-3'}"
		>
			{#each pool as d (d.num)}
				<button
					type="button"
					data-custom-sound
					onclick={() => guess(d.num)}
					disabled={phase !== 'round'}
					class="relative flex cursor-pointer flex-col items-center justify-center rounded-none border border-white/10 bg-white/5 py-3 transition-all hover:border-accent/50 hover:bg-accent/15 active:scale-95 disabled:cursor-default disabled:opacity-50 disabled:hover:border-white/10 disabled:hover:bg-white/5 sm:py-4"
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
		<div class="relative mt-3 flex flex-wrap items-center justify-center gap-1">
			{#if cheatLine}
				{#key cheatCount}
					<span
						role="status"
						class="cheater-pop pointer-events-none absolute top-full left-1/2 z-10 mt-2 rounded-none bg-rose-500/90 px-3 py-1.5 font-black whitespace-nowrap text-white shadow-lg shadow-rose-500/30 {pixel
							? 'font-pixel text-[8px]'
							: 'text-sm'}"
					>
						{cheatLine}
					</span>
				{/key}
			{/if}
			<span class="mr-1 text-muted/70 {pixel ? 'text-[6px]' : 'text-[10px]'}">Hear:</span>
			{#each pool as d (d.num)}
				<button
					type="button"
					data-custom-sound
					onclick={() => playSingle(d.num)}
					disabled={phase !== 'round'}
					class="cursor-pointer rounded-none border border-white/8 bg-white/4 px-2 py-1 font-bold text-muted transition-all hover:border-accent/40 hover:text-white active:scale-95 disabled:opacity-40 {pixel
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
		Number keys answer · Backspace undo · Space replay · Enter start
	</p>
</div>

<style>
	/* Score bumps up briefly when it changes */
	.score-pop {
		display: inline-block;
		animation: scorePop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	/* The heart you just lost shakes */
	.heart-shake {
		animation: heartShake 0.45s ease-in-out;
	}

	@keyframes scorePop {
		0% {
			transform: scale(1);
		}
		40% {
			transform: scale(1.3);
		}
		100% {
			transform: scale(1);
		}
	}

	@keyframes heartShake {
		0%,
		100% {
			transform: translateX(0) rotate(0);
		}
		20% {
			transform: translateX(-4px) rotate(-12deg);
		}
		40% {
			transform: translateX(4px) rotate(10deg);
		}
		60% {
			transform: translateX(-3px) rotate(-6deg);
		}
		80% {
			transform: translateX(2px) rotate(3deg);
		}
	}

	/* "Cheater!" bubble pops up over the Hear row, wobbles, then settles */
	.cheater-pop {
		translate: -50% 0;
		animation: cheaterPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	@keyframes cheaterPop {
		0% {
			opacity: 0;
			transform: translateY(-8px) scale(0.6) rotate(-6deg);
		}
		60% {
			opacity: 1;
			transform: translateY(2px) scale(1.08) rotate(3deg);
		}
		100% {
			transform: translateY(0) scale(1) rotate(0);
		}
	}

	/* Win: each chord box hops and glows green, left to right */
	.slot-win {
		animation: slotWin 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}

	@keyframes slotWin {
		0% {
			transform: translateY(0) scale(1);
			box-shadow: 0 0 0 0 rgba(52, 211, 153, 0);
		}
		40% {
			transform: translateY(-10px) scale(1.06);
			box-shadow: 0 0 28px 2px rgba(52, 211, 153, 0.45);
		}
		100% {
			transform: translateY(0) scale(1);
			box-shadow: 0 0 14px 0 rgba(52, 211, 153, 0.2);
		}
	}

	.win-text {
		display: inline-block;
		animation: winText 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	@keyframes winText {
		0% {
			opacity: 0;
			transform: scale(0.5);
		}
		60% {
			opacity: 1;
			transform: scale(1.18);
		}
		100% {
			transform: scale(1);
		}
	}

	.plus-one {
		animation: plusOne 0.9s ease-out forwards;
	}

	@keyframes plusOne {
		0% {
			opacity: 0;
			transform: translateY(6px) scale(0.6);
		}
		25% {
			opacity: 1;
			transform: translateY(-6px) scale(1.15);
		}
		100% {
			opacity: 0;
			transform: translateY(-30px) scale(1);
		}
	}

	.confetti {
		opacity: 0;
		animation: confettiBurst 1.1s cubic-bezier(0.15, 0.7, 0.3, 1) forwards;
	}

	@keyframes confettiBurst {
		0% {
			opacity: 1;
			transform: translate(-50%, -50%) rotate(0);
		}
		70% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy) + 60px)) rotate(var(--rot));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.slot-win,
		.win-text,
		.plus-one,
		.confetti,
		.cheater-pop,
		.score-pop,
		.heart-shake {
			animation: none;
		}
	}
</style>
