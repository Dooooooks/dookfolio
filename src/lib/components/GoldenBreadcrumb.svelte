<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import {
		gameDevMode,
		upgrades,
		triggerGoldenBoost,
		tickGoldenBoost,
		addQuacks
	} from '$lib/game-mode.svelte';
	import { synth } from '$lib/synth.svelte';

	let { onGoldenReward }: { onGoldenReward: (text: string, isBurst?: boolean) => void } = $props();

	let containerEl = $state<HTMLElement | null>(null);
	let crumbWrapperEl = $state<HTMLElement | null>(null);

	interface ActiveCrumb {
		id: number;
		isBurst: boolean;
	}

	let activeCrumb = $state<ActiveCrumb | null>(null);
	let isHovered = false;
	let nextId = 0;
	let spawnTimer: ReturnType<typeof setTimeout> | null = null;
	let rafId: number | null = null;
	let boostTickInterval: ReturnType<typeof setInterval> | null = null;

	// High-performance RAF motion variables (pure GPU transform, zero Svelte re-renders per frame)
	let posX = 0;
	let baseY = 0;
	let dir = 1; // 1 = left to right, -1 = right to left
	let speedX = 0; // px per second
	let rot = 0;
	let lastFrameTime = 0;

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

		const containerWidth = containerEl?.clientWidth || window.innerWidth;
		const containerHeight = containerEl?.clientHeight || 400;

		const fromLeft = Math.random() > 0.5;
		dir = fromLeft ? 1 : -1;

		// Start offscreen
		posX = fromLeft ? -50 : containerWidth + 50;

		// Random vertical height safely within the container
		const minY = Math.max(40, containerHeight * 0.15);
		const maxY = Math.max(minY + 20, containerHeight * 0.75);
		baseY = Math.floor(Math.random() * (maxY - minY)) + minY;

		// Float duration ~14s to 18s across the container
		const travelDistance = containerWidth + 100;
		const durationSec = 14 + Math.random() * 4;
		speedX = travelDistance / durationSec;

		rot = Math.floor(Math.random() * 360);
		lastFrameTime = performance.now();
		isHovered = false;

		// 50% chance of Quack Burst, 50% chance of Golden Rush Multiplier
		const isBurst = Math.random() < 0.5;
		activeCrumb = { id: nextId++, isBurst };

		if (rafId) cancelAnimationFrame(rafId);
		rafId = requestAnimationFrame(animateDrift);
	}

	function animateDrift(now: number) {
		if (!activeCrumb) return;

		const dt = Math.min((now - lastFrameTime) / 1000, 0.1);
		lastFrameTime = now;

		// Smooth gentle speed reduction on hover for easy clicking
		const currentSpeed = isHovered ? speedX * 0.35 : speedX;
		posX += dir * currentSpeed * dt;
		rot += (isHovered ? 15 : 35) * dt;

		const containerWidth = containerEl?.clientWidth || window.innerWidth;

		// Despawn once completely past the other side
		if ((dir === 1 && posX > containerWidth + 60) || (dir === -1 && posX < -60)) {
			activeCrumb = null;
			scheduleNextSpawn();
			return;
		}

		// Smooth 60-144fps sinusoidal bobbing
		const bobY = Math.sin(posX * 0.015) * 8;
		const currentY = baseY + bobY;

		if (crumbWrapperEl) {
			crumbWrapperEl.style.transform = `translate3d(${posX}px, ${currentY}px, 0) rotate(${rot}deg)`;
		}

		rafId = requestAnimationFrame(animateDrift);
	}

	function handleCrumbClick() {
		if (!activeCrumb) return;

		if (rafId) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}

		synth.playUpgrade();

		const isBurst = activeCrumb.isBurst;

		if (isBurst) {
			const baseFlat = 1 + upgrades.strongerQuack + gameDevMode.fedCount;
			const burstMultiplier = (1 + upgrades.scavengerDuck * 0.5) * (1 + upgrades.goldenCrumbs * 0.4);
			const burst = Math.round(30 * baseFlat * burstMultiplier);
			addQuacks(burst);
			onGoldenReward(`✨ Crumb Burst! +${burst.toLocaleString()} Quacks! ✨`, true);
		} else {
			const duration = 10 + upgrades.scavengerDuck * 2;
			const multiplier = 3 + upgrades.goldenCrumbs * 0.2;
			triggerGoldenBoost(duration, multiplier);
			onGoldenReward(`✨ Quack Rush! ${multiplier.toFixed(1)}x Quacks for ${duration}s! ✨`, false);
		}

		// Despawn golden crumb (CRITICAL: Does NOT affect gameDevMode.fedCount or game dev mode!)
		activeCrumb = null;
		scheduleNextSpawn();
	}

	onMount(() => {
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
		if (rafId) cancelAnimationFrame(rafId);
		if (boostTickInterval) clearInterval(boostTickInterval);
	});
</script>

<!-- Dedicated Golden Breadcrumb Overlay Layer -->
<div
	bind:this={containerEl}
	class="pointer-events-none absolute inset-0 z-30 overflow-hidden"
	aria-hidden={!activeCrumb}
>
	{#if activeCrumb}
		<!-- Hardware-accelerated GPU translate layer (60–144+ FPS, zero reflow) -->
		<div
			bind:this={crumbWrapperEl}
			class="pointer-events-none absolute top-0 left-0 will-change-transform"
			style="transform: translate3d(-100px, -100px, 0);"
		>
			<button
				type="button"
				onclick={handleCrumbClick}
				onpointerenter={() => (isHovered = true)}
				onpointerleave={() => (isHovered = false)}
				aria-label={activeCrumb.isBurst
					? 'Burst Breadcrumb (Click for instant quacks)'
					: 'Golden Breadcrumb (Click for Quack Rush)'}
				class="pointer-events-auto group relative flex cursor-pointer items-center justify-center p-2 transition-transform duration-200 hover:scale-130 active:scale-95 focus:outline-hidden"
			>
				<!-- Pixelated Breadcrumb: #ff9494 if Burst, #ffe794 if Multiplier -->
				<div
					class="relative flex size-7 items-center justify-center rounded-lg border p-1 shadow-md backdrop-blur-xs transition-all duration-200 {activeCrumb.isBurst
						? 'border-[#ff9494]/60 bg-[#ff9494]/20 shadow-[#ff9494]/30 group-hover:border-[#ff9494] group-hover:bg-[#ff9494]/35 group-hover:shadow-[#ff9494]/50'
						: 'border-[#ffe794]/60 bg-[#ffe794]/20 shadow-[#ffe794]/30 group-hover:border-[#ffe794] group-hover:bg-[#ffe794]/35 group-hover:shadow-[#ffe794]/50'}"
					title={activeCrumb.isBurst
						? 'Burst Breadcrumb (Click for instant quacks!)'
						: 'Golden Breadcrumb (Click for Quack Rush!)'}
				>
					<svg viewBox="0 0 16 16" class="size-4 select-none">
						{#if activeCrumb.isBurst}
							<rect x="4" y="2" width="8" height="2" fill="#fff5f5" />
							<rect x="2" y="4" width="12" height="8" fill="#ff9494" />
							<rect x="4" y="6" width="4" height="4" fill="#e86b6b" />
							<rect x="4" y="12" width="8" height="2" fill="#b84040" />
							<rect x="10" y="4" width="2" height="2" fill="#ffffff" />
						{:else}
							<rect x="4" y="2" width="8" height="2" fill="#fffdf2" />
							<rect x="2" y="4" width="12" height="8" fill="#ffe794" />
							<rect x="4" y="6" width="4" height="4" fill="#f5d56b" />
							<rect x="4" y="12" width="8" height="2" fill="#c49b28" />
							<rect x="10" y="4" width="2" height="2" fill="#ffffff" />
						{/if}
					</svg>
				</div>
			</button>
		</div>
	{/if}
</div>
