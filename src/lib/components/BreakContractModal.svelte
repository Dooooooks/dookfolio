<script lang="ts">
	import { X } from '@lucide/svelte';
	import duckYellow from '$lib/assets/duck_yellow.png';
	import {
		breakContractModal,
		confirmBreakContract,
		closeBreakContractModal
	} from '$lib/game-mode.svelte';

	function handleKeydown(e: KeyboardEvent) {
		if (!breakContractModal.open) return;
		if (e.key === 'Escape') {
			closeBreakContractModal();
		}
	}

	$effect(() => {
		if (typeof document !== 'undefined') {
			if (breakContractModal.open) {
				document.body.style.overflow = 'hidden';
			} else {
				document.body.style.overflow = '';
			}
		}
		return () => {
			if (typeof document !== 'undefined') {
				document.body.style.overflow = '';
			}
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if breakContractModal.open}
	<div
		role="dialog"
		aria-modal="true"
		aria-labelledby="break-contract-title"
		tabindex="-1"
		onclick={(e) => {
			if (e.target === e.currentTarget) closeBreakContractModal();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') closeBreakContractModal();
		}}
		class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-black/80 p-4 backdrop-blur-xs transition-opacity duration-200 select-none"
	>
		<!-- Modal Dialog Card -->
		<div
			class="relative flex w-full max-w-md flex-col items-center overflow-hidden rounded-3xl border border-accent/30 bg-surface/95 p-6 text-center shadow-2xl shadow-accent/20 backdrop-blur-md sm:p-8"
		>
			<!-- Close Button -->
			<button
				type="button"
				onclick={closeBreakContractModal}
				aria-label="Close dialog"
				class="absolute top-4 right-4 cursor-pointer rounded-xl p-1.5 text-muted transition-colors hover:bg-white/10 hover:text-white focus:outline-hidden"
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
					onclick={confirmBreakContract}
					class="flex-1 cursor-pointer rounded-2xl border border-accent/40 bg-accent/20 px-5 py-3 font-pixel text-sm font-bold tracking-wider text-accent shadow-xs shadow-accent/20 transition-all duration-200 hover:scale-[1.03] hover:border-accent hover:bg-accent/30 focus:outline-hidden active:scale-95"
				>
					Quack
				</button>

				<!-- No Way (Keep Contract - Right) -->
				<button
					type="button"
					onclick={closeBreakContractModal}
					class="flex-1 cursor-pointer rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-pixel text-sm font-bold tracking-wider text-muted shadow-xs transition-all duration-200 hover:scale-[1.03] hover:border-white/30 hover:bg-white/10 hover:text-white focus:outline-hidden active:scale-95"
				>
					No Way
				</button>
			</div>
		</div>
	</div>
{/if}
