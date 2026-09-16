<script lang="ts">
	import { ShoppingBag, Sparkles, X } from '@lucide/svelte';
	import duckYellow from '$lib/assets/duck_yellow.png';
	import {
		gameDevMode,
		shopModal,
		closeShopModal,
		upgrades,
		UPGRADE_CONFIGS,
		getUpgradeCost,
		buyUpgrade,
		type UpgradesState
	} from '$lib/game-mode.svelte';
	import { lockScroll, unlockScroll } from '$lib/scroll-lock';

	let isClosing = $state(false);
	let isVisible = $state(false);

	const isAllCompleted = $derived(
		upgrades.strongerQuack >= 5 &&
			upgrades.luckyQuack >= 5 &&
			upgrades.heavyQuack >= 5 &&
			upgrades.quackCombo >= 5 &&
			upgrades.goldenCrumbs >= 5 &&
			upgrades.scavengerDuck >= 5
	);

	$effect(() => {
		if (shopModal.open && !isVisible && !isClosing) {
			isVisible = true;
		} else if (!shopModal.open && isVisible && !isClosing) {
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
			closeShopModal();
		}, 180);
	}

	const upgradeKeys: (keyof UpgradesState)[] = [
		'strongerQuack',
		'luckyQuack',
		'heavyQuack',
		'quackCombo',
		'goldenCrumbs',
		'scavengerDuck'
	];
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isVisible}
	<div
		role="dialog"
		aria-modal="true"
		aria-labelledby="quack-shop-title"
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
			class="relative flex w-full max-w-lg flex-col items-center overflow-hidden rounded-3xl border border-accent/30 bg-surface/95 p-5 shadow-2xl shadow-accent/20 backdrop-blur-md will-change-transform sm:p-7 {isClosing
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

			{#if isAllCompleted}
				<!-- Completed Message Screen -->
				<div class="flex flex-col items-center py-2 text-center">
					<!-- Pixel Duck with Glow -->
					<div class="relative mb-4 flex size-20 items-center justify-center">
						<div class="absolute inset-0 rounded-full bg-accent/20 blur-md"></div>
						<img
							src={duckYellow}
							alt="Game Completed Duck"
							class="relative size-16 transition-transform duration-200 pixelated hover:scale-110"
						/>
					</div>

					<div class="mb-3 flex items-center justify-center gap-2 text-accent">
						<Sparkles class="size-5" />
						<h3
							id="quack-shop-title"
							class="text-xl font-extrabold tracking-wide text-white sm:text-2xl {gameDevMode.active
								? 'font-pixel'
								: 'font-sans'}"
						>
							Game Complete!
						</h3>
						<Sparkles class="size-5" />
					</div>

					<!-- Thank You Message -->
					<p
						class="max-w-md text-sm sm:text-base leading-relaxed text-purple-200/95 font-medium {gameDevMode.active
							? 'font-pixel text-xs sm:text-sm leading-relaxed'
							: ''}"
					>
						"Wow, I can't believe you stuck around to the end of such a simple game! Thanks a ton for taking the time. I wish you all the best!"
					</p>

					<!-- Final Score Badge -->
					<div
						class="mt-6 flex items-center gap-2 rounded-2xl border border-accent/25 bg-accent/10 px-4 py-2 text-xs font-bold text-muted"
					>
						<span>Final Score:</span>
						<span
							class="font-black text-white sm:text-sm {gameDevMode.active
								? 'font-pixel text-[#ffe794]'
								: 'text-accent'}"
						>
							{gameDevMode.quacks.toLocaleString()}
						</span>
						<span>quacks</span>
					</div>

					<!-- Close Button -->
					<button
						type="button"
						onclick={handleClose}
						class="mt-6 cursor-pointer rounded-2xl border border-accent/40 bg-accent/20 px-6 py-2.5 font-bold tracking-wide text-accent shadow-xs shadow-accent/20 transition-all duration-200 hover:scale-105 hover:border-accent hover:bg-accent/30 active:scale-95 {gameDevMode.active
							? 'font-pixel text-xs'
							: 'text-sm'}"
					>
						Awesome!
					</button>
				</div>
			{:else}
				<!-- Header Icon & Title -->
				<div class="mb-1 flex items-center gap-2 text-accent">
					<ShoppingBag class="size-5" />
					<h3
						id="quack-shop-title"
						class="text-xl font-extrabold tracking-wide text-white sm:text-2xl {gameDevMode.active
							? 'font-pixel'
							: 'font-sans'}"
					>
						Quack Upgrade Shop
					</h3>
				</div>

				<!-- Current Quack Balance Banner -->
				<div class="mt-1 mb-5 flex items-center gap-1.5 text-xs text-muted">
					<span>Balance:</span>
					<span
						class="font-black text-white sm:text-sm {gameDevMode.active
							? 'font-pixel text-[#ffe794]'
							: 'text-accent'}"
					>
						{gameDevMode.quacks.toLocaleString()}
					</span>
					<span>{gameDevMode.quacks === 1 ? 'quack' : 'quacks'}</span>
				</div>

				<!-- Upgrades List: [Upgrade Name] [Bar1..Bar5] [Upgrade Button] -->
				<div class="flex w-full max-h-[50vh] sm:max-h-[56vh] flex-col gap-3 overflow-y-auto pr-1">
					{#each upgradeKeys as key (key)}
						{@const config = UPGRADE_CONFIGS[key]}
						{@const currentLevel = upgrades[key]}
						{@const cost = getUpgradeCost(key)}
						{@const canAfford = cost !== null && gameDevMode.quacks >= cost}
						{@const isMax = currentLevel >= 5}

						<div
							class="flex flex-col gap-2 rounded-2xl border border-white/8 bg-white/3 p-3 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-3"
						>
							<!-- [Upgrade Name] & Info -->
							<div class="flex flex-col sm:w-40 shrink-0">
								<span
									class="text-xs font-bold text-white sm:text-sm {gameDevMode.active
										? 'font-pixel text-[13px]'
										: ''}"
								>
									{config.name}
								</span>
								<span class="text-[10px] text-muted leading-tight">
									{#if key === 'strongerQuack' && gameDevMode.fedCount > 0}
										{config.description} <span class="font-bold {gameDevMode.active ? 'text-[#ffe794]' : 'text-accent'}">(+{gameDevMode.fedCount} crumbs)</span>
									{:else}
										{config.description}
									{/if}
								</span>
							</div>

							<!-- [Bar1] [Bar2] [Bar3] [Bar4] [Bar5] -->
							<div class="flex items-center gap-1 sm:gap-1.5" aria-label="Progress level {currentLevel} of 5">
								{#each [0, 1, 2, 3, 4] as barIndex}
									{@const isFilled = currentLevel > barIndex}
									<div
										class="h-4.5 w-5.5 rounded-sm transition-all duration-200 sm:h-5 sm:w-6 {isFilled
											? gameDevMode.active
												? 'border border-[#ffe794]/80 bg-[#ffe794] shadow-xs shadow-[#ffe794]/50'
												: 'border border-accent/80 bg-accent shadow-xs shadow-accent/50'
											: 'border border-white/10 bg-white/8'}"
									></div>
								{/each}
							</div>

							<!-- [Upgrade Button] -->
							<button
								type="button"
								disabled={isMax || !canAfford}
								onclick={() => buyUpgrade(key)}
								aria-label={isMax
									? `${config.name} maxed out`
									: `Upgrade ${config.name} for ${cost} quacks`}
								class="flex cursor-pointer items-center justify-center rounded-xl px-3 py-1.5 text-center text-xs font-extrabold transition-all duration-200 sm:w-32 {gameDevMode.active
									? 'font-pixel text-[11px]'
									: ''} {isMax
									? 'cursor-default border border-white/10 bg-white/5 text-muted/50'
									: canAfford
										? gameDevMode.active
											? 'border border-[#ffe794]/40 bg-[#ffe794]/20 text-[#ffe794] shadow-xs shadow-[#ffe794]/20 hover:scale-105 hover:bg-[#ffe794]/30 active:scale-95'
											: 'border border-accent/40 bg-accent/20 text-accent shadow-xs shadow-accent/20 hover:scale-105 hover:bg-accent/30 hover:border-accent active:scale-95'
										: 'cursor-not-allowed border border-white/8 bg-white/4 text-muted/50 opacity-60'}"
							>
								{#if isMax}
									<span>MAX</span>
								{:else}
									<span>{cost?.toLocaleString()} Quacks</span>
								{/if}
							</button>
						</div>
					{/each}
				</div>

				<!-- Footer Hint -->
				<p class="mt-5 text-center text-[10px] text-muted/70">
					Click the duck to harvest quacks and unlock all 5 tiers!
				</p>
			{/if}
		</div>
	</div>
{/if}
