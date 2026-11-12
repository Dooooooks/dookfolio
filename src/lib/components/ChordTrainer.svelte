<script lang="ts">
	import { onDestroy, onMount, type Snippet } from 'svelte';
	import { Heart, Play, RotateCcw, Trophy, Undo2 } from '@lucide/svelte';
	import { chordModal, gameDevMode } from '$lib/game-mode.svelte';
	import {
		chordGame as game,
		degree,
		DEGREES,
		KEY_NAMES,
		LIFE_SLOTS,
		MIN_POOL,
		SLOTS
	} from '$lib/chord-trainer.svelte';

	interface Props {
		// Keyboard shortcuts only work while active (e.g. the modal is open and not closing)
		active?: boolean;
		// Extra buttons shown in the top-right corner (close, fullscreen…)
		actions?: Snippet;
	}

	let { active = true, actions }: Props = $props();

	// The game itself lives in a shared store (chord-trainer.svelte.ts) so the modal and the
	// /chord-progression page drive the same game; these are read-only views of its state
	const phase = $derived(game.phase);
	const enabled = $derived(game.enabled);
	const poolWarning = $derived(game.poolWarning);
	const key = $derived(game.key);
	const progression = $derived(game.progression);
	const guesses = $derived(game.guesses);
	const score = $derived(game.score);
	const lives = $derived(game.lives);
	const lastCorrect = $derived(game.lastCorrect);
	const playingIndex = $derived(game.playingIndex);
	const isNewBest = $derived(game.isNewBest);
	const celebration = $derived(game.celebration);
	const confetti = $derived(game.confetti);
	const cheatLine = $derived(game.cheatLine);
	const cheatCount = $derived(game.cheatCount);
	const cheatedThisRound = $derived(game.cheatedThisRound);
	const pool = $derived(game.pool);
	const bestScore = $derived(game.bestScore);
	const winMessage = $derived(game.winMessage);
	const {
		chordName,
		togglePool,
		playProgression,
		playSingle,
		playSlot,
		startGame,
		guess,
		undo,
		slotState
	} = game;

	// ---- Lifecycle ----

	onMount(game.load);

	// Stop the music and go back to the start screen when the host deactivates or removes the
	// game, except while the modal is handing the game off to the full-screen page
	onDestroy(() => {
		if (!chordModal.handoff) game.reset();
	});
	$effect(() => {
		if (!active && !chordModal.handoff) game.reset();
	});

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

<div class="relative flex w-full flex-col items-center">
	{#if actions}
		<div class="absolute -top-1 -right-1 flex items-center gap-1 sm:-top-3 sm:-right-3">
			{@render actions()}
		</div>
	{/if}

	<!-- Header -->
	<div class="mb-1 flex items-center gap-2">
		<h3
			id="chord-title"
			class="font-extrabold tracking-wide text-white {pixel
				? 'font-pixel text-xs sm:text-sm'
				: 'font-sans text-lg sm:text-xl'}"
		>
			Chord Progression
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
