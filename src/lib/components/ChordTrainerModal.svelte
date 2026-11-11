<script lang="ts">
	import { tick } from 'svelte';
	import { Maximize2, X } from '@lucide/svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { chordModal, closeChordModal } from '$lib/game-mode.svelte';
	import { lockScroll, unlockScroll } from '$lib/scroll-lock';
	import ChordTrainer from './ChordTrainer.svelte';

	const EXPAND_MS = 450;

	let isClosing = $state(false);
	let isVisible = $state(false);
	// Fullscreen hand-off: the card grows to fill the screen, then we navigate to /chords
	let isExpanding = $state(false);
	let card = $state<HTMLDivElement | null>(null);
	let expandStyle = $state('');

	$effect(() => {
		if (chordModal.open && !isVisible && !isClosing) {
			isVisible = true;
		} else if (!chordModal.open && isVisible && !isClosing && !isExpanding) {
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
		if (isClosing || !isVisible || isExpanding) return;
		isClosing = true;
		setTimeout(() => {
			isClosing = false;
			isVisible = false;
			closeChordModal();
		}, 180);
	}

	async function goFullscreen() {
		if (!card || isExpanding || isClosing) return;
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		if (!reduceMotion) {
			// FLIP: pin the card where it is right now, then animate it out to the edges of the screen
			const r = card.getBoundingClientRect();
			expandStyle = `position: fixed; top: ${r.top}px; left: ${r.left}px; width: ${r.width}px; height: ${r.height}px; max-width: none; margin: 0;`;
			isExpanding = true;
			await tick();
			card.getBoundingClientRect(); // force layout so the next style change animates
			expandStyle = `position: fixed; top: 0px; left: 0px; width: 100vw; height: 100dvh; max-width: none; margin: 0; transition: top ${EXPAND_MS}ms cubic-bezier(0.65, 0, 0.35, 1), left ${EXPAND_MS}ms cubic-bezier(0.65, 0, 0.35, 1), width ${EXPAND_MS}ms cubic-bezier(0.65, 0, 0.35, 1), height ${EXPAND_MS}ms cubic-bezier(0.65, 0, 0.35, 1), background-color ${EXPAND_MS}ms ease;`;
			await new Promise((done) => setTimeout(done, EXPAND_MS + 30));
		} else {
			isExpanding = true;
		}

		await goto(resolve('/chords'));

		// The page underneath is now /chords, so drop the modal instantly (no close animation)
		chordModal.open = false;
		isVisible = false;
		isExpanding = false;
		expandStyle = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (isVisible && !isClosing && e.key === 'Escape') handleClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isVisible}
	<!--
		The blurred backdrop is a sibling layer, not the dialog's parent: a parent with its own
		backdrop blur or fading opacity would stop the card's glass from seeing the page behind it
	-->
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
		class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain p-4 select-none"
	>
		<div
			aria-hidden="true"
			class="pointer-events-none fixed inset-0 bg-black/20 backdrop-blur-sm {isClosing
				? 'anim-modal-backdrop-out'
				: 'anim-modal-backdrop-in'}"
		></div>

		<!-- Liquid glass card -->
		<div
			bind:this={card}
			style={expandStyle}
			class="relative my-auto flex w-full max-w-lg flex-col items-center overflow-hidden rounded-none p-5 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.5)] backdrop-blur-lg will-change-transform sm:p-8 {isExpanding
				? 'z-10 bg-bg'
				: 'bg-surface/70'} {isClosing ? 'anim-modal-out' : isExpanding ? '' : 'anim-modal-in'}"
		>
			<!-- The game fades out while the card grows, then the /chords page fades it back in -->
			<div
				class="flex w-full flex-col items-center transition-opacity duration-200 {isExpanding
					? 'opacity-0'
					: 'opacity-100'}"
			>
				<ChordTrainer active={!isClosing && !isExpanding}>
					{#snippet actions()}
						<button
							type="button"
							onclick={goFullscreen}
							aria-label="Open full screen"
							title="Full screen"
							class="cursor-pointer rounded-none p-1.5 text-muted transition-colors hover:bg-white/10 hover:text-white focus:outline-hidden"
						>
							<Maximize2 class="size-4.5" />
						</button>
						<button
							type="button"
							onclick={handleClose}
							aria-label="Close dialog"
							class="cursor-pointer rounded-none p-1.5 text-muted transition-colors hover:bg-white/10 hover:text-white focus:outline-hidden"
						>
							<X class="size-5" />
						</button>
					{/snippet}
				</ChordTrainer>
			</div>
		</div>
	</div>
{/if}
