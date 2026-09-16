<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import {
		gameDevMode,
		upgrades,
		triggerGoldenBoost,
		tickGoldenBoost
	} from '$lib/game-mode.svelte';
	import { Sparkles } from '@lucide/svelte';

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
			onGoldenReward(`🌟 GOLDEN BURST! +${burst.toLocaleString()} Quacks! 🌟`);
		} else {
			const duration = 10 + upgrades.scavengerDuck * 2;
			const multiplier = 3 + upgrades.goldenCrumbs * 0.2;
			triggerGoldenBoost(duration, multiplier);
			onGoldenReward(`⚡ GOLDEN RUSH! ${multiplier.toFixed(1)}x Quacks for ${duration}s! ⚡`);
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
				activeCrumb.rot += 1.5;

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
	<!-- Glowing Golden Breadcrumb Floating Across Screen -->
	<button
		type="button"
		onclick={handleCrumbClick}
		aria-label="Golden Breadcrumb (Click for instant reward)"
		class="pointer-events-auto absolute z-30 flex cursor-pointer items-center justify-center p-2 transition-transform duration-75 hover:scale-125 active:scale-95"
		style="left: {activeCrumb.x}%; top: {activeCrumb.y}%; transform: translate(-50%, -50%) rotate({activeCrumb.rot}deg);"
	>
		<div class="relative flex size-8 items-center justify-center">
			<!-- Pulsing golden aura glow -->
			<div class="absolute inset-0 animate-ping rounded-full bg-[#ffe794]/40 blur-xs"></div>
			<div class="absolute -inset-1 rounded-full bg-[#ffe794]/60 blur-sm"></div>

			<!-- Golden Crumb Shape -->
			<div
				class="relative size-5 rounded-md border-2 border-yellow-200 bg-gradient-to-br from-[#fff7d1] via-[#ffe794] to-[#f5b838] shadow-[0_0_15px_rgba(255,231,148,0.9)]"
			>
				<Sparkles class="absolute -top-1 -right-1 size-3 text-white animate-spin" />
			</div>
		</div>
	</button>
{/if}
