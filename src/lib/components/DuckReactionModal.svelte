<script lang="ts">
	import { onMount } from 'svelte';
	import { X, RotateCcw, Zap, Trophy, AlertTriangle, Timer } from '@lucide/svelte';
	import duckWhite from '$lib/assets/duck_white.png';
	import duckYellow from '$lib/assets/duck_yellow.png';
	import { gameDevMode, reactionModal, closeReactionModal } from '$lib/game-mode.svelte';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	const isOpen = $derived(reactionModal.open || open);

	type TestState = 'idle' | 'waiting' | 'early' | 'active' | 'result';

	let testPhase: TestState = $state('idle');
	let startTime = 0;
	let reactionTime: number | null = $state(null);
	let bestTime: number | null = $state(null);
	let waitTimeout: ReturnType<typeof setTimeout> | null = null;

	const DUCK_REFLEX_MS = 110;

	function close() {
		cleanup();
		closeReactionModal();
		open = false;
	}

	function cleanup() {
		if (waitTimeout) {
			clearTimeout(waitTimeout);
			waitTimeout = null;
		}
		testPhase = 'idle';
		reactionTime = null;
	}

	function startTest() {
		if (waitTimeout) clearTimeout(waitTimeout);
		testPhase = 'waiting';
		reactionTime = null;

		// Random delay between 1.5s and 4.5s
		const delay = 1500 + Math.random() * 3000;

		waitTimeout = setTimeout(() => {
			testPhase = 'active';
			// Align startTime precisely with the actual monitor frame render using double-rAF
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					startTime = performance.now();
				});
			});
		}, delay);
	}

	function handleAction(eventTime: number) {
		if (testPhase === 'idle' || testPhase === 'early') {
			startTest();
		} else if (testPhase === 'waiting') {
			// Clicked / pressed too early!
			if (waitTimeout) clearTimeout(waitTimeout);
			testPhase = 'early';
		} else if (testPhase === 'active') {
			// Instantaneous raw reaction time captured via hardware timestamp
			const elapsed = Math.max(1, Math.round(eventTime - startTime));
			reactionTime = elapsed;
			if (bestTime === null || elapsed < bestTime) {
				bestTime = elapsed;
			}
			testPhase = 'result';
		} else if (testPhase === 'result') {
			startTest();
		}
	}

	function handlePondPointerDown(e: PointerEvent) {
		e.preventDefault();
		const eventTime = e.timeStamp > 0 ? e.timeStamp : performance.now();
		handleAction(eventTime);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) {
			close();
			return;
		}
		if (isOpen && (e.code === 'Space' || e.code === 'Enter')) {
			e.preventDefault();
			if (!e.repeat) {
				const eventTime = e.timeStamp > 0 ? e.timeStamp : performance.now();
				handleAction(eventTime);
			}
		}
	}

	onMount(() => {
		// Pre-decode duck image assets into GPU texture memory
		const wImg = new Image();
		wImg.src = duckWhite;
		wImg.decode?.().catch(() => {});

		const yImg = new Image();
		yImg.src = duckYellow;
		yImg.decode?.().catch(() => {});

		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			if (waitTimeout) clearTimeout(waitTimeout);
		};
	});

	// Dynamic comparison rating
	const resultTier = $derived.by(() => {
		if (reactionTime === null) return null;
		if (reactionTime < 110) {
			return {
				title: 'Superhuman Avian Master!',
				badge: 'Faster than a Duck',
				badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
				comparison: `Incredible! You reacted in ${reactionTime}ms, beating the mallard duck benchmark (~${DUCK_REFLEX_MS}ms)!`,
				icon: Trophy
			};
		}
		if (reactionTime <= 180) {
			return {
				title: 'Esports Reflexes!',
				badge: 'Almost Duck Speed',
				badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
				comparison: `Blazing speed! At ${reactionTime}ms, you are on par with pro gamers and hot on the duck's tail (~${DUCK_REFLEX_MS}ms).`,
				icon: Zap
			};
		}
		if (reactionTime <= 270) {
			return {
				title: 'Solid Human Speed',
				badge: 'Duck Got Away',
				badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
				comparison: `Normal human speed (${reactionTime}ms). The duck flew away with a confident quack (~${DUCK_REFLEX_MS}ms).`,
				icon: Timer
			};
		}
		return {
			title: 'Sitting Duck!',
			badge: 'Sleeping Turtle',
			badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
			comparison: `Ouch! ${reactionTime}ms. Even a duck taking an afternoon nap reacted faster (~${DUCK_REFLEX_MS}ms).`,
			icon: AlertTriangle
		};
	});

	$effect(() => {
		if (isOpen) {
			const originalOverflow = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = originalOverflow;
			};
		}
	});
</script>

{#if isOpen}
	<!-- Backdrop: Clicking outside dismisses the floating window -->
	<div
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
		tabindex="-1"
		onclick={(e) => {
			if (e.target === e.currentTarget) close();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') close();
		}}
		onwheel={(e) => {
			if (e.target === e.currentTarget) e.preventDefault();
		}}
		ontouchmove={(e) => {
			if (e.target === e.currentTarget) e.preventDefault();
		}}
		class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-black/80 p-4 backdrop-blur-xs transition-opacity duration-150"
	>
		<!-- Floating Window Card (At least 70% of the screen) -->
		<div
			class="relative flex h-[78vh] min-h-[520px] w-[92vw] max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-surface shadow-2xl shadow-accent/15 transition-all md:w-[78vw] lg:w-[72vw]"
		>
			<!-- Modal Header -->
			<div
				class="flex items-center justify-between border-b border-white/8 px-6 py-4 sm:px-8 sm:py-5"
			>
				<div class="flex items-center gap-3">
					<img
						src={gameDevMode.active ? duckYellow : duckWhite}
						alt="Duck"
						class="size-7 pixelated"
					/>
					<div>
						<h3 id="modal-title" class="text-lg font-extrabold text-white">
							Are you faster than a duck?
						</h3>
						<p class="text-xs text-muted">Raw reaction time test</p>
					</div>
				</div>

				<button
					type="button"
					onclick={close}
					aria-label="Close reaction test"
					class="cursor-pointer rounded-xl p-2 text-muted transition-colors hover:bg-white/10 hover:text-white"
				>
					<X class="size-6" />
				</button>
			</div>

			<!-- Test Area / Pond -->
			<div class="flex min-h-0 flex-1 flex-col p-6 sm:p-8">
				<!-- Pond Container: Fills the entire available space inside the 70% modal -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					onpointerdown={handlePondPointerDown}
					class="relative flex min-h-0 w-full flex-1 cursor-pointer touch-manipulation flex-col items-center justify-center overflow-hidden rounded-2xl border will-change-transform select-none {testPhase ===
					'active'
						? 'border-emerald-400 bg-emerald-950/85 shadow-[0_0_60px_rgba(52,211,153,0.35)] ring-8 ring-emerald-400/50 transition-none'
						: testPhase === 'early'
							? 'border-red-500/50 bg-red-950/25 transition-colors duration-150'
							: testPhase === 'waiting'
								? 'border-amber-500/30 bg-surface/90 transition-colors duration-150'
								: 'border-white/10 bg-bg/70 transition-colors duration-150 hover:border-accent/40'}"
				>
					<!-- Pre-warmed Active Stimulus: Zero DOM Mount Churn, Instant GPU Reveal -->
					<div
						class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-6 transition-none {testPhase ===
						'active'
							? 'scale-100 opacity-100'
							: 'pointer-events-none scale-95 opacity-0'}"
					>
						<span
							class="mb-4 animate-bounce rounded-full bg-emerald-400 px-7 py-2.5 font-pixel text-base font-black text-black shadow-2xl shadow-emerald-400/60 sm:text-lg"
						>
							QUACK! CLICK / SPACEBAR NOW!
						</span>
						<img
							src={gameDevMode.active ? duckYellow : duckWhite}
							alt="Duck"
							decoding="async"
							class="size-32 scale-110 drop-shadow-[0_0_40px_rgba(52,211,153,1)] pixelated sm:size-40 md:size-48"
						/>
						<p class="mt-4 text-sm font-black tracking-wider text-emerald-300 sm:text-base">
							Click Anywhere or Press [Space]!
						</p>
					</div>

					{#if testPhase === 'idle'}
						<div class="pointer-events-none max-w-md p-6 text-center">
							<div
								class="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-accent/15 text-accent shadow-inner"
							>
								<Zap class="size-8" />
							</div>
							<p class="text-2xl font-extrabold text-white sm:text-3xl">
								Click or Press [Space] to Start
							</p>
							<p class="mt-2 text-sm text-muted sm:text-base">
								When the duck surfaces, click anywhere or hit <strong>Spacebar</strong> as fast as you
								can.
							</p>
						</div>
					{:else if testPhase === 'waiting'}
						<div class="pointer-events-none p-6 text-center">
							<div class="mx-auto mb-5 size-6 animate-ping rounded-full bg-amber-400"></div>
							<p class="text-2xl font-extrabold text-amber-300 sm:text-3xl">Wait for the duck...</p>
							<p class="mt-2 text-sm text-muted sm:text-base">
								Don't click or press Space yet or you'll startle the duck!
							</p>
						</div>
					{:else if testPhase === 'early'}
						<div class="pointer-events-none p-6 text-center">
							<div
								class="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-red-500/20 text-red-400"
							>
								<AlertTriangle class="size-8" />
							</div>
							<p class="text-2xl font-extrabold text-red-300 sm:text-3xl">Too Early!</p>
							<p class="mt-2 text-sm text-muted sm:text-base">
								You startled the duck! Click or press Space to retry.
							</p>
						</div>
					{:else if testPhase === 'result' && resultTier}
						<!-- Result Card inside the pond -->
						<div class="flex max-w-lg flex-col items-center p-6 text-center">
							<span
								class="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-extrabold sm:text-sm {resultTier.badgeColor}"
							>
								<resultTier.icon class="size-4" />
								{resultTier.badge}
							</span>

							<p class="mt-4 text-5xl font-extrabold text-white sm:text-6xl">
								{reactionTime}<span class="text-2xl font-bold text-muted"> ms</span>
							</p>

							<p class="mt-3 text-sm leading-relaxed text-muted sm:text-base">
								{resultTier.comparison}
							</p>

							<button
								type="button"
								onpointerdown={(e) => {
									e.stopPropagation();
									startTest();
								}}
								class="mt-6 inline-flex cursor-pointer items-center gap-2.5 rounded-full border border-accent/40 bg-accent/15 px-7 py-3 text-sm font-extrabold text-accent shadow-lg transition-all hover:bg-accent hover:text-bg active:scale-95"
							>
								<RotateCcw class="size-4" />
								Click or [Space] to Try Again
							</button>
						</div>
					{/if}
				</div>

				<!-- Stats & Benchmark Reference Footer -->
				<div class="mt-5 flex items-center justify-between text-xs text-muted sm:text-sm">
					<div class="flex items-center gap-2">
						<span class="font-bold text-white">Duck Average:</span>
						<span class="rounded bg-accent/10 px-2 py-0.5 font-extrabold text-accent">~80 ms</span>
					</div>

					<div
						class="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-muted sm:flex"
					>
						<span class="font-bold text-white">[Space]</span> or Click
					</div>

					{#if bestTime !== null}
						<div class="flex items-center gap-2">
							<span class="font-bold text-white">Your Session Best:</span>
							<span class="rounded bg-emerald-500/10 px-2 py-0.5 font-extrabold text-emerald-400">
								{bestTime} ms
							</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
