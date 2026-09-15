<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { gameDevMode, reactionModal } from '$lib/game-mode.svelte';
	import {
		PALETTE,
		SHARD_BASE_SHAPES,
		LEFT_SHARDS,
		RIGHT_SHARDS,
		ROUTE_LAYOUTS,
		getRouteLayoutKey
	} from './triangle-presets';

	let { isOpen = true }: { isOpen?: boolean } = $props();

	let mouseX = $state(0);
	let mouseY = $state(0);
	let targetX = $state(0);
	let targetY = $state(0);

	const currentLayout = $derived(ROUTE_LAYOUTS[getRouteLayoutKey(page.url.pathname)]);

	function handleMouseMove(e: MouseEvent) {
		if (reactionModal.open) return;
		const normX = (e.clientX / window.innerWidth - 0.5) * 2;
		const normY = (e.clientY / window.innerHeight - 0.5) * 2;
		targetX = normX * 8;
		targetY = normY * 8;
	}

	onMount(() => {
		let rafId: number;
		function lerp() {
			// Suspend work during reaction test modal to grant 100% CPU/GPU headroom
			if (!reactionModal.open) {
				mouseX += (targetX - mouseX) * 0.05;
				mouseY += (targetY - mouseY) * 0.05;
			}
			rafId = requestAnimationFrame(lerp);
		}
		rafId = requestAnimationFrame(lerp);

		window.addEventListener('mousemove', handleMouseMove, { passive: true });
		return () => {
			cancelAnimationFrame(rafId);
			window.removeEventListener('mousemove', handleMouseMove);
		};
	});
</script>

<!-- SVG Gradients & Glow Filter (Consistent across all tabs and gaming mode) -->
<svg class="absolute size-0 overflow-hidden" aria-hidden="true" focusable="false">
	<defs>
		<linearGradient id="flank-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
			<stop offset="0%" stop-color="#b694ff" stop-opacity="0.28" />
			<stop offset="100%" stop-color="#7c3aed" stop-opacity="0.04" />
		</linearGradient>
		<linearGradient id="flank-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
			<stop offset="0%" stop-color="#cbb1ff" stop-opacity="0.22" />
			<stop offset="100%" stop-color="#4c1d95" stop-opacity="0.03" />
		</linearGradient>

		<!-- Crystalline broken glass facet gradient with specular edge sheen -->
		<linearGradient id="flank-grad-glass" x1="20%" y1="0%" x2="80%" y2="100%">
			<stop offset="0%" stop-color="#f5eeff" stop-opacity="0.34" />
			<stop offset="40%" stop-color="#c084fc" stop-opacity="0.14" />
			<stop offset="100%" stop-color="#6366f1" stop-opacity="0.02" />
		</linearGradient>

		<!-- Subtle Glow Filter -->
		<filter id="shard-glow" x="-30%" y="-30%" width="160%" height="160%">
			<feGaussianBlur stdDeviation="3" result="blur" />
			<feComposite in="SourceGraphic" in2="blur" operator="over" />
		</filter>
	</defs>
</svg>

<!-- Left Flank -->
<aside
	aria-hidden="true"
	class="pointer-events-none fixed inset-y-0 z-0 w-32 overflow-hidden opacity-40 transition-all duration-300 ease-in-out sm:w-48 sm:opacity-75 md:w-60 lg:w-72 lg:opacity-100 {isOpen
		? 'left-0 md:left-52'
		: 'left-0'}"
>
	<div
		class="relative size-full transition-transform duration-300 ease-out"
		style="transform: translate3d({mouseX * 0.8}px, {mouseY * 0.8}px, 0);"
	>
		{#each LEFT_SHARDS as shard, i (shard.id)}
			{@const t = currentLayout.left[i]}
			{@const shape = SHARD_BASE_SHAPES[shard.variant]}
			<!-- Outer container: smooth transitions of position, rotation, and scale when navigating -->
			<div
				class="absolute transition-all duration-850 ease-[cubic-bezier(0.2,0.9,0.3,1)]"
				style="left: {t.x}%; top: {t.y}%; z-index: {shard.layer === 'fg'
					? 3
					: shard.layer === 'bg'
						? 1
						: 2}; transform: translate(-50%, -50%) rotate({t.rot}deg) scale({t.scale});"
			>
				<!-- Inner container: continuous floating drift -->
				<div class={shard.animClass} style="animation-delay: {shard.delay};">
					<svg viewBox="-80 -50 160 100" class="size-20 overflow-visible sm:size-28 lg:size-36">
						<!-- Smooth Triangle: active in normal mode -->
						<polygon
							points={shape.smooth}
							fill={shard.fill}
							stroke={shard.stroke}
							stroke-width={shard.strokeWidth ?? PALETTE.strokeWidth}
							filter="url(#shard-glow)"
							class="transition-opacity duration-500 ease-in-out"
							style="opacity: {gameDevMode.active ? 0 : (shard.opacity ?? 1)};"
						/>

						<!-- Pixel-Perfect Stepped Triangle: smooth crossfade in gaming mode (same consistent colors) -->
						<path
							d={shape.pixel}
							fill={shard.fill}
							stroke={shard.stroke}
							stroke-width={shard.strokeWidth ?? PALETTE.strokeWidth}
							filter="url(#shard-glow)"
							class="transition-opacity duration-500 ease-in-out pixelated"
							style="opacity: {gameDevMode.active ? (shard.opacity ?? 1) : 0};"
						/>
					</svg>
				</div>
			</div>
		{/each}
	</div>
</aside>

<!-- Right Flank -->
<aside
	aria-hidden="true"
	class="pointer-events-none fixed inset-y-0 right-0 z-0 w-32 overflow-hidden opacity-40 transition-opacity duration-700 sm:w-48 sm:opacity-75 md:w-64 lg:w-80 lg:opacity-100"
>
	<div
		class="relative size-full transition-transform duration-300 ease-out"
		style="transform: translate3d({-mouseX * 0.8}px, {mouseY * 0.8}px, 0);"
	>
		{#each RIGHT_SHARDS as shard, i (shard.id)}
			{@const t = currentLayout.right[i]}
			{@const shape = SHARD_BASE_SHAPES[shard.variant]}
			<!-- Outer container: smooth transitions of position, rotation, and scale when navigating -->
			<div
				class="absolute transition-all duration-850 ease-[cubic-bezier(0.2,0.9,0.3,1)]"
				style="left: {t.x}%; top: {t.y}%; z-index: {shard.layer === 'fg'
					? 3
					: shard.layer === 'bg'
						? 1
						: 2}; transform: translate(-50%, -50%) rotate({t.rot}deg) scale({t.scale});"
			>
				<!-- Inner container: continuous floating drift -->
				<div class={shard.animClass} style="animation-delay: {shard.delay};">
					<svg viewBox="-80 -50 160 100" class="size-20 overflow-visible sm:size-28 lg:size-36">
						<!-- Smooth Triangle: active in normal mode -->
						<polygon
							points={shape.smooth}
							fill={shard.fill}
							stroke={shard.stroke}
							stroke-width={shard.strokeWidth ?? PALETTE.strokeWidth}
							filter="url(#shard-glow)"
							class="transition-opacity duration-500 ease-in-out"
							style="opacity: {gameDevMode.active ? 0 : (shard.opacity ?? 1)};"
						/>

						<!-- Pixel-Perfect Stepped Triangle: smooth crossfade in gaming mode (same consistent colors) -->
						<path
							d={shape.pixel}
							fill={shard.fill}
							stroke={shard.stroke}
							stroke-width={shard.strokeWidth ?? PALETTE.strokeWidth}
							filter="url(#shard-glow)"
							class="transition-opacity duration-500 ease-in-out pixelated"
							style="opacity: {gameDevMode.active ? (shard.opacity ?? 1) : 0};"
						/>
					</svg>
				</div>
			</div>
		{/each}
	</div>
</aside>
