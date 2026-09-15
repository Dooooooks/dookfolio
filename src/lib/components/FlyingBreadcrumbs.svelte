<script lang="ts">
	import { onMount } from 'svelte';
	import { gameDevMode } from '$lib/game-mode.svelte';

	let {
		onFeed,
		duckElement = null
	}: {
		onFeed: () => void;
		duckElement?: HTMLElement | null;
	} = $props();

	interface Crumb {
		id: number;
		x: number; // percentage in hero (0 - 100)
		y: number; // percentage in hero (0 - 100)
		rot: number; // degrees
		delay: string;
		animClass: string;
		status: 'floating' | 'flying' | 'consumed';
		targetX: number;
		targetY: number;
	}

	const ANIM_CLASSES = ['anim-crumb-1', 'anim-crumb-2', 'anim-crumb-3'];

	// Distributed spawn sectors clustered closer to the middle while avoiding the left-side text
	const SPAWN_SECTORS = [
		{ minX: 44, maxX: 56, minY: 14, maxY: 32 }, // Upper center
		{ minX: 48, maxX: 62, minY: 36, maxY: 56 }, // Mid center
		{ minX: 42, maxX: 56, minY: 62, maxY: 82 }, // Lower center
		{ minX: 58, maxX: 72, minY: 16, maxY: 40 }, // Upper right-center
		{ minX: 60, maxX: 74, minY: 48, maxY: 72 } // Lower right-center
	];

	function createRandomCrumb(id: number, sectorIndex?: number): Crumb {
		const sector =
			sectorIndex !== undefined
				? SPAWN_SECTORS[sectorIndex % SPAWN_SECTORS.length]
				: SPAWN_SECTORS[Math.floor(Math.random() * SPAWN_SECTORS.length)];

		const x = Math.floor(Math.random() * (sector.maxX - sector.minX)) + sector.minX;
		const y = Math.floor(Math.random() * (sector.maxY - sector.minY)) + sector.minY;
		const rot = Math.floor(Math.random() * 40) - 20;
		const animClass = ANIM_CLASSES[Math.floor(Math.random() * ANIM_CLASSES.length)];
		const delay = `${(Math.random() * 2.2).toFixed(1)}s`;

		return {
			id,
			x,
			y,
			rot,
			delay,
			animClass,
			status: 'floating',
			targetX: 0,
			targetY: 0
		};
	}

	function spawnRandomCrumbs(count = 5): Crumb[] {
		return Array.from({ length: count }, (_, i) => createRandomCrumb(i + 1, i));
	}

	let crumbs = $state<Crumb[]>(spawnRandomCrumbs(5));

	onMount(() => {
		crumbs = spawnRandomCrumbs(5);
	});

	// Reset to new random positions when game dev mode is turned off
	$effect(() => {
		if (!gameDevMode.active && gameDevMode.fedCount === 0) {
			crumbs = spawnRandomCrumbs(5);
		}
	});

	function handleCrumbInteract(crumb: Crumb, e: PointerEvent | MouseEvent | TouchEvent) {
		if (crumb.status !== 'floating' || gameDevMode.fedCount >= 5) return;
		if (e.cancelable) e.preventDefault();

		let targetX = 0;
		let targetY = 0;

		const targetBtn = duckElement ?? document.getElementById('hero-duck-button');
		const currentTarget = e.currentTarget as HTMLElement | null;

		if (targetBtn && currentTarget) {
			const duckRect = targetBtn.getBoundingClientRect();
			const crumbRect = currentTarget.getBoundingClientRect();
			targetX = duckRect.left + duckRect.width / 2 - (crumbRect.left + crumbRect.width / 2);
			targetY = duckRect.top + duckRect.height / 2 - (crumbRect.top + crumbRect.height / 2);
		} else {
			targetX = 220;
			targetY = -80;
		}

		crumb.targetX = targetX;
		crumb.targetY = targetY;
		crumb.status = 'flying';

		setTimeout(() => {
			crumb.status = 'consumed';
			onFeed();

			// Respawn at a fresh random position if duck is not yet fully fed
			if (gameDevMode.fedCount < 5) {
				setTimeout(() => {
					if (gameDevMode.fedCount < 5) {
						const fresh = createRandomCrumb(crumb.id);
						crumb.x = fresh.x;
						crumb.y = fresh.y;
						crumb.rot = fresh.rot;
						crumb.delay = fresh.delay;
						crumb.animClass = fresh.animClass;
						crumb.targetX = 0;
						crumb.targetY = 0;
						crumb.status = 'floating';
					}
				}, 1100);
			}
		}, 420);
	}
</script>

<!-- Floating Breadcrumbs Container (Zero Yellow, 100% Brand Violet/Lavender) -->
<div
	class="pointer-events-none absolute inset-0 z-10 overflow-visible transition-opacity duration-700 {gameDevMode.fedCount >=
	5
		? 'opacity-0'
		: 'opacity-100'}"
	aria-hidden="true"
>
	{#each crumbs as crumb (crumb.id)}
		{#if crumb.status !== 'consumed'}
			<div
				class="absolute transition-all duration-500"
				style="left: {crumb.x}%; top: {crumb.y}%; {crumb.status === 'flying'
					? 'z-index: 50;'
					: 'z-index: 10;'}"
			>
				<button
					type="button"
					onpointerdown={(e) => handleCrumbInteract(crumb, e)}
					aria-label="Feed breadcrumb to duck"
					class="group pointer-events-auto relative cursor-pointer touch-manipulation p-2 -m-2 focus:outline-hidden"
					style={crumb.status === 'flying'
						? `transform: translate3d(${crumb.targetX}px, ${crumb.targetY}px, 0) scale(0.35) rotate(220deg); opacity: 0; transition: transform 0.42s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.42s ease-in;`
						: `transform: rotate(${crumb.rot}deg); transition: transform 0.25s ease-out;`}
				>
					<div
						class={crumb.status === 'floating' ? crumb.animClass : ''}
						style="animation-delay: {crumb.delay};"
					>
						<!-- Pixelated Breadcrumb Chunk (Pure Lavender / Purple Palette - No Yellow) -->
						<div
							class="relative flex size-7 items-center justify-center rounded-lg border border-accent/40 bg-accent/15 p-1 shadow-md shadow-accent/20 backdrop-blur-xs transition-all duration-200 group-hover:scale-130 group-hover:border-accent group-hover:bg-accent/30 group-hover:shadow-accent/40 group-active:scale-90"
							title="Click to feed the duck!"
						>
							<svg viewBox="0 0 16 16" class="size-4 select-none">
								<!-- Pixel breadcrumb facets -->
								<rect x="4" y="2" width="8" height="2" fill="#cbb1ff" />
								<rect x="2" y="4" width="12" height="8" fill="#b694ff" />
								<rect x="4" y="6" width="4" height="4" fill="#7c3aed" />
								<rect x="4" y="12" width="8" height="2" fill="#7c3aed" />
								<rect x="10" y="4" width="2" height="2" fill="#cbb1ff" />
							</svg>

							<!-- Subtle ambient sparkle halo -->
							<div
								class="pointer-events-none absolute -inset-1 rounded-lg bg-accent/10 opacity-0 blur-xs transition-opacity group-hover:opacity-100"
							></div>
						</div>
					</div>
				</button>
			</div>
		{/if}
	{/each}
</div>
