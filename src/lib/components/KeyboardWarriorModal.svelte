<script lang="ts">
	import { onMount } from 'svelte';
	import { Keyboard, X } from '@lucide/svelte';
	import { gameDevMode, typingModal, closeTypingModal } from '$lib/game-mode.svelte';
	import { lockScroll, unlockScroll } from '$lib/scroll-lock';
	import VolumeControl from './VolumeControl.svelte';

	// The game is loaded on first open (and prefetched once the browser is idle) instead of
	// shipping in every page's initial bundle
	let gameModule: Promise<typeof import('./KeyboardWarrior.svelte')> | undefined;
	// Once the game has loaded it owns Escape (pause -> main menu -> close)
	let gameReady = $state(false);
	const loadGame = () =>
		(gameModule ??= import('./KeyboardWarrior.svelte').then((module) => {
			gameReady = true;
			return module;
		}));

	onMount(() => {
		if ('requestIdleCallback' in window) {
			const id = requestIdleCallback(() => loadGame(), { timeout: 5000 });
			return () => cancelIdleCallback(id);
		}
		const id = setTimeout(loadGame, 2000);
		return () => clearTimeout(id);
	});

	let isClosing = $state(false);
	let isVisible = $state(false);

	$effect(() => {
		if (typingModal.open && !isVisible && !isClosing) {
			isVisible = true;
		} else if (!typingModal.open && isVisible && !isClosing) {
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

	function handleClose() {
		if (isClosing || !isVisible) return;
		isClosing = true;
		setTimeout(() => {
			isClosing = false;
			isVisible = false;
			closeTypingModal();
		}, 180);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (isVisible && !isClosing && !gameReady && e.key === 'Escape') handleClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isVisible}
	<div
		role="dialog"
		aria-modal="true"
		aria-labelledby="typing-title"
		tabindex="-1"
		onclick={(e) => {
			if (e.target === e.currentTarget) handleClose();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape' && !gameReady) handleClose();
		}}
		class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain p-0 select-none md:p-4"
	>
		<!-- Blurred backdrop as a sibling layer so the card's frosted glass can see the page -->
		<div
			aria-hidden="true"
			class="pointer-events-none fixed inset-0 bg-black/20 backdrop-blur-sm {isClosing
				? 'anim-modal-backdrop-out'
				: 'anim-modal-backdrop-in'}"
		></div>

		<!-- Liquid glass card -->
		<div
			class="relative flex h-dvh min-h-0 w-full flex-col overflow-hidden rounded-none bg-surface/70 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.5)] backdrop-blur-lg will-change-transform md:h-[92dvh] md:max-h-[900px] md:w-[96vw] md:max-w-[1500px] {isClosing
				? 'anim-modal-out'
				: 'anim-modal-in'}"
		>
			<div class="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
				<div class="flex items-center gap-2.5 text-accent">
					<Keyboard class="size-5" />
					<div>
						<h3
							id="typing-title"
							class="font-extrabold text-white {gameDevMode.active
								? 'font-pixel text-xs sm:text-sm'
								: 'text-base sm:text-lg'}"
						>
							Keyboard Warrior
						</h3>
						<p class="text-muted {gameDevMode.active ? 'text-[7px]' : 'text-[11px] sm:text-xs'}">
							If you are trying to measure your real WPM, This is not the place :>
						</p>
					</div>
				</div>
				<div class="flex items-center gap-1.5">
					<VolumeControl class="border border-white/15 bg-white/[0.09] backdrop-blur-md" />
					<button
						type="button"
						onclick={handleClose}
						aria-label="Close dialog"
						class="flex size-8 cursor-pointer items-center justify-center border border-white/15 bg-white/[0.09] text-muted backdrop-blur-md transition-colors hover:border-white/30 hover:bg-white/[0.15] hover:text-white focus:outline-hidden"
					>
						<X class="size-4.5" />
					</button>
				</div>
			</div>

			<div class="flex min-h-0 flex-1 flex-col px-2 pb-2 sm:px-6 sm:pb-6">
				{#await loadGame() then { default: KeyboardWarrior }}
					<KeyboardWarrior active={!isClosing} onexit={handleClose} />
				{/await}
			</div>
		</div>
	</div>
{/if}
