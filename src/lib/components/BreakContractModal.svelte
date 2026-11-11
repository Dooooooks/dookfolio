<script lang="ts">
	import { X } from '@lucide/svelte';
	import duckYellow from '$lib/assets/duck_yellow.png';
	import {
		breakContractModal,
		confirmBreakContract,
		closeBreakContractModal
	} from '$lib/game-mode.svelte';
	import { synth } from '$lib/synth.svelte';
	import { lockScroll, unlockScroll } from '$lib/scroll-lock';

	let isClosing = $state(false);
	let isVisible = $state(false);

	$effect(() => {
		if (breakContractModal.open && !isVisible && !isClosing) {
			isVisible = true;
		} else if (!breakContractModal.open && isVisible && !isClosing) {
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
		}
	}

	function handleClose() {
		if (isClosing || !isVisible) return;
		isClosing = true;
		setTimeout(() => {
			isClosing = false;
			isVisible = false;
			closeBreakContractModal();
		}, 180);
	}

	function handleConfirm() {
		if (isClosing || !isVisible) return;
		synth.playPowerDown();
		isClosing = true;
		setTimeout(() => {
			isClosing = false;
			isVisible = false;
			confirmBreakContract();
		}, 180);
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isVisible}
	<div
		role="dialog"
		aria-modal="true"
		aria-labelledby="break-contract-title"
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
			class="relative flex w-full max-w-md flex-col items-center overflow-hidden rounded-none bg-surface/70 p-6 text-center shadow-[0_20px_50px_-25px_rgba(0,0,0,0.5)] backdrop-blur-lg will-change-transform sm:p-8 {isClosing
				? 'anim-modal-out'
				: 'anim-modal-in'}"
		>
			<!-- Close Button -->
			<button
				type="button"
				onclick={handleClose}
				aria-label="Close dialog"
				class="absolute top-4 right-4 cursor-pointer rounded-none p-1.5 text-muted transition-colors hover:bg-white/10 hover:text-white focus:outline-hidden"
			>
				<X class="size-5" />
			</button>

			<!-- Pixel Duck Icon -->
			<div class="relative mb-4 flex size-20 items-center justify-center">
				<div class="absolute inset-0 rounded-full bg-accent/20 blur-md"></div>
				<img
					src={duckYellow}
					alt="Game Mode Duck"
					class="relative size-16 transition-transform duration-200 pixelated hover:scale-110"
				/>
			</div>

			<!-- Main Question -->
			<h3
				id="break-contract-title"
				class="font-pixel text-xl font-extrabold tracking-wide text-white sm:text-2xl"
			>
				Break the Duck's Heart?
			</h3>

			<!-- Action Buttons: Quack on left, No Way on right -->
			<div class="mt-7 flex w-full flex-col gap-3 sm:flex-row sm:gap-4">
				<!-- Quack (Break Contract - Left) -->
				<button
					type="button"
					onclick={handleConfirm}
					class="flex-1 cursor-pointer rounded-none border border-accent/40 bg-accent/20 px-5 py-3 font-pixel text-sm font-bold tracking-wider text-accent shadow-xs shadow-accent/20 transition-all duration-200 hover:scale-[1.03] hover:border-accent hover:bg-accent/30 focus:outline-hidden active:scale-95"
				>
					Quack
				</button>

				<!-- No Way (Keep Contract - Right) -->
				<button
					type="button"
					onclick={handleClose}
					class="flex-1 cursor-pointer rounded-none border border-white/15 bg-white/5 px-5 py-3 font-pixel text-sm font-bold tracking-wider text-muted shadow-xs transition-all duration-200 hover:scale-[1.03] hover:border-white/30 hover:bg-white/10 hover:text-white focus:outline-hidden active:scale-95"
				>
					No Way
				</button>
			</div>
		</div>
	</div>
{/if}
