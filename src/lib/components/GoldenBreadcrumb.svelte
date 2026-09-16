<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import {
		gameDevMode,
		upgrades,
		triggerGoldenBoost,
		tickGoldenBoost
	} from '$lib/game-mode.svelte';
	let { onGoldenReward }: { onGoldenReward: (text: string) => void } = $props();

	interface GoldenCrumbInstance {
		id: number;
		x: number; // 0 to 100%
		y: number; // 15 to 80%
		speedX: number;
		rot: number;
	}

	let activeCrumb = $state<GoldenCrumbInstance | null>(null);
	let nextId = 0;
	let spawnTimer: ReturnType<typeof setTimeout> | null = null;
	let moveInterval: ReturnType<typeof setInterval> | null = null;
	let boostTickInterval: ReturnType<typeof setInterval> | null = null;

	function scheduleNextSpawn() {
		if (spawnTimer) clearTimeout(spawnTimer);
		if (upgrades.goldenCrumbs < 1) return;

		// Spawn interval: 42s down to 12s based on Scavenger Duck level
		const baseDelay = Math.max(12000, 42000 - upgrades.scavengerDuck * 6000);
		const jitter = Math.floor(Math.random() * 5000) - 2500;
		const delay = Math.max(8000, baseDelay + jitter);

		spawnTimer = setTimeout(() => {
			spawnGoldenCrumb();
		}, delay);
	}

	function spawnGoldenCrumb() {
		if (upgrades.goldenCrumbs < 1 || activeCrumb) {
			scheduleNextSpawn();
			return;
		}

		const fromLeft = Math.random() > 0.5;
		activeCrumb = {
			id: nextId++,
			x: fromLeft ? -5 : 105,
			y: Math.floor(Math.random() * 60) + 20, // 20% to 80%
			speedX: fromLeft ? 0.35 : -0.35,
			rot: Math.floor(Math.random() * 360)
		};
	}

	function handleCrumbClick() {
		if (!activeCrumb) return;

		// 50% chance of Quack Burst, 50% chance of Golden Rush (3x Multiplier)
		const isBurst = Math.random() < 0.5;

		if (isBurst) {
			const baseFlat = 1 + upgrades.strongerQuack + gameDevMode.fedCount;
			const burstMultiplier = (1 + upgrades.scavengerDuck * 0.5) * (1 + upgrades.goldenCrumbs * 0.4);
			const burst = Math.round(30 * baseFlat * burstMultiplier);
			gameDevMode.quacks += burst;
			onGoldenReward(`✨ Crumb Burst! +${burst.toLocaleString()} Quacks! ✨`);
		} else {
			const duration = 10 + upgrades.scavengerDuck * 2;
			const multiplier = 3 + upgrades.goldenCrumbs * 0.2;
			triggerGoldenBoost(duration, multiplier);
			onGoldenReward(`✨ Quack Rush! ${multiplier.toFixed(1)}x Quacks for ${duration}s! ✨`);
		}

		// Despawn golden crumb (CRITICAL: Does NOT affect gameDevMode.fedCount or game dev mode!)
		activeCrumb = null;
		scheduleNextSpawn();
	}

	onMount(() => {
		// Drift interval
		moveInterval = setInterval(() => {
			if (activeCrumb) {
				activeCrumb.x += activeCrumb.speedX;
				activeCrumb.rot += 1.2;

				// Despawn if drifted completely off screen
				if (activeCrumb.x < -10 || activeCrumb.x > 110) {
					activeCrumb = null;
					scheduleNextSpawn();
				}
			}
		}, 50);

		// Golden boost countdown tick
		boostTickInterval = setInterval(() => {
			tickGoldenBoost();
		}, 1000);

		scheduleNextSpawn();
	});

	// Re-schedule when goldenCrumbs or scavengerDuck upgrades change
	$effect(() => {
		if (upgrades.goldenCrumbs >= 1 && !spawnTimer && !activeCrumb) {
			scheduleNextSpawn();
		}
	});

	onDestroy(() => {
		if (spawnTimer) clearTimeout(spawnTimer);
		if (moveInterval) clearInterval(moveInterval);
		if (boostTickInterval) clearInterval(boostTickInterval);
	});
</script>

{#if activeCrumb}
	<!-- Simple Lucky Breadcrumb Floating Across Screen (Palette Consistent) -->
	<button
		type="button"
		onclick={handleCrumbClick}
		aria-label="Lucky Breadcrumb (Click for reward)"
		class="pointer-events-auto group absolute z-30 flex cursor-pointer items-center justify-center p-2 transition-transform duration-150 hover:scale-125 active:scale-95"
		style="left: {activeCrumb.x}%; top: {activeCrumb.y}%; transform: translate(-50%, -50%) rotate({activeCrumb.rot}deg);"
	>
		<!-- Pixelated Golden Breadcrumb (In line with #ffe794) -->
		<div
			class="relative flex size-7 items-center justify-center rounded-lg border border-[#ffe794]/60 bg-[#ffe794]/20 p-1 shadow-md shadow-[#ffe794]/30 backdrop-blur-xs transition-all duration-200 group-hover:border-[#ffe794] group-hover:bg-[#ffe794]/35 group-hover:shadow-[#ffe794]/50"
			title="Golden Breadcrumb (Click for reward!)"
		>
			<svg viewBox="0 0 16 16" class="size-4 select-none">
				<rect x="4" y="2" width="8" height="2" fill="#fffdf2" />
				<rect x="2" y="4" width="12" height="8" fill="#ffe794" />
				<rect x="4" y="6" width="4" height="4" fill="#f5d56b" />
				<rect x="4" y="12" width="8" height="2" fill="#c49b28" />
				<rect x="10" y="4" width="2" height="2" fill="#ffffff" />
			</svg>
		</div>
	</button>
{/if}
