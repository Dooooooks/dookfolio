<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { gameDevMode, reactionModal } from '$lib/game-mode.svelte';
	import {
		PALETTE,
		POND_SHAPES,
		POND_PIXEL_PATHS,
		LEFT_SHARDS,
		RIGHT_SHARDS,
		ROUTE_LAYOUTS,
		getRouteLayoutKey,
		UNDERWATER,
		BUBBLES,
		POND_FLOOR,
		BUBBLE_PIXEL_PATH,
		weedPath,
		weedPixelPath,
		type ShardDefinition,
		type ShardTransform
	} from './pond-presets';

	let { isOpen = true }: { isOpen?: boolean } = $props();

	// Motion state lives outside Svelte reactivity: transforms are written straight to the DOM each frame
	let mouseX = 0;
	let mouseY = 0;
	let targetX = 0;
	let targetY = 0;

	let scrollY = 0;
	let targetScrollY = 0;
	let viewportHeight = 0;
	// Cached scrollable height, re-measured only when the page or window resizes
	let maxScroll = 1;
	let prefersReducedMotion = false;
	let isMobile = $state(false);
	let isLoopRunning = false;
	let rafId = 0;
	let lastFrameTime = 0;

	// Surface items float up and away as the page sinks; nearer layers leave faster
	const SURFACE_SPEED = { fg: 0.5, mg: 0.38, bg: 0.26 } as const;
	// A page needs this many screens of scrolling to reach full depth; shorter pages are shallower ponds
	const FULL_DEPTH_SCREENS = 2.5;
	const FLOOR_HEIGHT_RATIO = 0.45;
	// After changing pages, the scene eases back up to the surface over this long
	const RETURN_DURATION = 900;
	let isReturning = $state(false);
	let returnTimer: ReturnType<typeof setTimeout> | undefined;
	let lastPathname = '';

	const itemEls: Record<string, HTMLDivElement> = {};
	let leftFlankEl: HTMLDivElement | undefined = $state();
	let rightFlankEl: HTMLDivElement | undefined = $state();
	let tintEl: HTMLDivElement | undefined = $state();
	const bubbleEls: HTMLDivElement[] = [];
	const floorEls: HTMLDivElement[] = [];

	const currentLayout = $derived(ROUTE_LAYOUTS[getRouteLayoutKey(page.url.pathname)]);

	function smoothstep(edge0: number, edge1: number, x: number) {
		const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
		return t * t * (3 - 2 * t);
	}

	function wakeLoop() {
		if (!isLoopRunning && !reactionModal.open && !prefersReducedMotion) {
			isLoopRunning = true;
			lastFrameTime = performance.now();
			rafId = requestAnimationFrame(tick);
		}
	}

	function handleMouseMove(e: MouseEvent) {
		if (reactionModal.open) return;
		const normX = (e.clientX / window.innerWidth - 0.5) * 2;
		const normY = (e.clientY / window.innerHeight - 0.5) * 2;
		targetX = normX * 8;
		targetY = normY * 8;
		wakeLoop();
	}

	function handleScroll() {
		if (reactionModal.open) return;
		targetScrollY = window.scrollY;
		// While returning to the surface, CSS transitions do the easing, so jump straight there
		if (prefersReducedMotion || isReturning) {
			// No motion: jump straight to the new depth so the tint and scenery just fade
			scrollY = targetScrollY;
			applyTransforms();
			return;
		}
		wakeLoop();
	}

	function measurePage() {
		maxScroll = Math.max(1, document.documentElement.scrollHeight - viewportHeight);
	}

	function handleResize() {
		viewportHeight = window.innerHeight;
		measurePage();
		wakeLoop();
	}

	function applyTransforms() {
		const progress = Math.min(1, scrollY / maxScroll);
		const depth = progress * Math.min(1, maxScroll / (viewportHeight * FULL_DEPTH_SCREENS));
		const motion = !prefersReducedMotion;

		// The surface fades away overhead as you sink, so nothing lingers by the pond floor
		const surfaceOpacity = (1 - smoothstep(0.3, 0.65, depth)).toFixed(3);
		const mouse = `translate3d(${(mouseX * 0.8).toFixed(2)}px, ${(mouseY * 0.8).toFixed(2)}px, 0)`;
		if (leftFlankEl) {
			leftFlankEl.style.transform = mouse;
			leftFlankEl.style.opacity = surfaceOpacity;
		}
		if (rightFlankEl) {
			rightFlankEl.style.transform = `translate3d(${(-mouseX * 0.8).toFixed(2)}px, ${(mouseY * 0.8).toFixed(2)}px, 0)`;
			rightFlankEl.style.opacity = surfaceOpacity;
		}

		// Surface: lily pads, feathers and reeds drift up out of view as you sink below them
		for (const shard of [...LEFT_SHARDS, ...RIGHT_SHARDS]) {
			const el = itemEls[shard.id];
			if (!el) continue;
			const dy = motion ? -scrollY * SURFACE_SPEED[shard.layer ?? 'mg'] : 0;
			el.style.transform = `translate3d(0, ${gameDevMode.active ? Math.round(dy) : dy.toFixed(2)}px, 0)`;
		}

		// Water turns bluer the deeper you go
		if (tintEl) tintEl.style.opacity = depth.toFixed(3);

		// Bubbles appear once you're below the surface
		const bubbleOpacity = smoothstep(0.06, 0.3, depth).toFixed(3);
		for (const el of bubbleEls) if (el) el.style.opacity = bubbleOpacity;

		// The pond floor rises into view as you reach the bottom of the page
		// Pages that barely scroll stay at the surface instead of jumping straight to the floor
		const floorReveal =
			smoothstep(0.7, 1, progress) * smoothstep(0.5, 1.2, maxScroll / viewportHeight);
		const floorOffset = motion ? (1 - floorReveal) * viewportHeight * FLOOR_HEIGHT_RATIO * 0.6 : 0;
		for (const el of floorEls) {
			if (!el) continue;
			el.style.opacity = floorReveal.toFixed(3);
			el.style.transform = `translate3d(0, ${floorOffset.toFixed(2)}px, 0)`;
		}
	}

	function tick(now: number) {
		if (reactionModal.open || prefersReducedMotion) {
			isLoopRunning = false;
			return;
		}

		// Normalize to 60fps steps so high refresh rate displays move at the same pace
		const dt = Math.min(3, (now - lastFrameTime) / 16.667);
		lastFrameTime = now;

		const dMouseX = targetX - mouseX;
		const dMouseY = targetY - mouseY;
		mouseX += dMouseX * 0.05 * dt;
		mouseY += dMouseY * 0.05 * dt;

		// Light easing on scroll softens wheel notches without feeling laggy
		const dScroll = targetScrollY - scrollY;
		const scrollStep = dScroll * Math.min(1, 0.18 * dt);
		scrollY += scrollStep;

		const isSettled =
			Math.abs(dMouseX) < 0.01 && Math.abs(dMouseY) < 0.01 && Math.abs(dScroll) < 0.1;

		if (isSettled) {
			mouseX = targetX;
			mouseY = targetY;
			scrollY = targetScrollY;
			applyTransforms();
			isLoopRunning = false;
			return;
		}

		applyTransforms();
		rafId = requestAnimationFrame(tick);
	}

	// Changing pages glides the whole scene back up to the surface instead of snapping
	$effect(() => {
		const pathname = page.url.pathname;
		if (lastPathname && pathname !== lastPathname) {
			isReturning = true;
			clearTimeout(returnTimer);
			returnTimer = setTimeout(() => (isReturning = false), RETURN_DURATION);
		}
		lastPathname = pathname;
	});

	// Re-apply when the route layout or pixel mode changes, since the loop may be asleep
	$effect(() => {
		void currentLayout;
		void gameDevMode.active;
		if (viewportHeight) applyTransforms();
	});

	onMount(() => {
		prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		targetScrollY = window.scrollY;
		scrollY = window.scrollY;
		viewportHeight = window.innerHeight;
		measurePage();

		// Page height changes when content loads or the route changes; re-measure only then
		const pageObserver = new ResizeObserver(() => {
			measurePage();
			applyTransforms();
		});
		pageObserver.observe(document.body);

		const mobileQuery = window.matchMedia('(max-width: 767px)');
		isMobile = mobileQuery.matches;
		const handleMobileChange = (e: MediaQueryListEvent) => {
			isMobile = e.matches;
		};
		mobileQuery.addEventListener('change', handleMobileChange);

		window.addEventListener('mousemove', handleMouseMove, { passive: true });
		window.addEventListener('scroll', handleScroll, { passive: true });
		window.addEventListener('resize', handleResize, { passive: true });

		const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		const handleMotionChange = (e: MediaQueryListEvent) => {
			prefersReducedMotion = e.matches;
			if (prefersReducedMotion) {
				scrollY = window.scrollY;
				isLoopRunning = false;
				cancelAnimationFrame(rafId);
				applyTransforms();
			}
		};
		motionQuery.addEventListener('change', handleMotionChange);

		// Place items immediately, then let the loop settle any motion
		applyTransforms();
		wakeLoop();

		return () => {
			cancelAnimationFrame(rafId);
			clearTimeout(returnTimer);
			pageObserver.disconnect();
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('resize', handleResize);
			motionQuery.removeEventListener('change', handleMotionChange);
			mobileQuery.removeEventListener('change', handleMobileChange);
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

		<!-- Subtle Glow Filter -->
		<filter id="shard-glow" x="-30%" y="-30%" width="160%" height="160%">
			<feGaussianBlur stdDeviation="3" result="blur" />
			<feComposite in="SourceGraphic" in2="blur" operator="over" />
		</filter>
	</defs>
</svg>

{#snippet pondItem(shard: ShardDefinition, t: ShardTransform, isLeft: boolean)}
	{@const shape = POND_SHAPES[shard.variant]}
	{@const pixel = POND_PIXEL_PATHS[shard.variant]}
	<!-- Outer container: smooth transitions of position, rotation, and scale when navigating -->
	<div
		class="absolute transition-all duration-850 ease-[cubic-bezier(0.2,0.9,0.3,1)]"
		style="left: {t.x}%; top: {t.y}%; z-index: {shard.layer === 'fg'
			? 3
			: shard.layer === 'bg'
				? 1
				: 2}; transform: translate(-50%, -50%) rotate({gameDevMode.active
			? 0
			: t.rot * shape.rotFactor}deg) scale({t.scale});"
	>
		<!-- Sinking Parallax Layer (transform written directly each frame) -->
		<div class="will-change-transform" data-pond-layer bind:this={itemEls[shard.id]}>
			<!-- Inner container: continuous floating drift -->
			<div class={shard.animClass} style="animation-delay: {shard.delay};">
				<svg viewBox="-80 -50 160 100" class="size-20 overflow-visible sm:size-28 lg:size-36">
					<!-- Size the drawing and mirror the right flank so items face the content -->
					<g transform="scale({isLeft ? shape.size : -shape.size}, {shape.size})">
						<!-- Smooth outline drawing: active in normal mode -->
						<g
							filter={isMobile ? undefined : 'url(#shard-glow)'}
							stroke={shard.stroke}
							stroke-width={shard.strokeWidth ?? PALETTE.strokeWidth}
							stroke-linecap="round"
							stroke-linejoin="round"
							class="transition-opacity duration-500 ease-in-out"
							style="opacity: {gameDevMode.active ? 0 : (shard.opacity ?? 1)};"
						>
							{#each shape.smooth as part, p (p)}
								<path
									d={part.d}
									fill={part.kind === 'body'
										? shard.fill
										: part.kind === 'dot'
											? shard.stroke
											: 'none'}
								/>
							{/each}
						</g>

						<!-- Pixel art sprite: smooth crossfade in gaming mode (same consistent colors) -->
						<g
							shape-rendering="crispEdges"
							class="transition-opacity duration-500 ease-in-out pixelated"
							style="opacity: {gameDevMode.active ? (shard.opacity ?? 1) : 0};"
						>
							<path d={pixel.fill} fill={shard.fill} />
							<path d={pixel.outline} fill={shard.stroke} />
						</g>
					</g>
				</svg>
			</div>
		</div>
	</div>
{/snippet}

{#snippet underwater(side: 'left' | 'right', index: number)}
	<!-- Rising bubbles (fade in once below the surface) -->
	<div class="absolute inset-0" style="opacity: 0;" data-pond-layer bind:this={bubbleEls[index]}>
		{#each BUBBLES[side] as bubble, b (b)}
			<div
				class="anim-pond-bubble absolute top-full"
				style="left: {bubble.x}%; animation-duration: {bubble.duration}s; animation-delay: {bubble.delay}s; --pond-drift: {bubble.drift}px;"
			>
				<svg
					viewBox="-6 -6 12 12"
					width={bubble.size}
					height={bubble.size}
					class="overflow-visible"
				>
					{#if gameDevMode.active}
						<path
							d={BUBBLE_PIXEL_PATH}
							fill={UNDERWATER.bubbleStroke}
							shape-rendering="crispEdges"
						/>
					{:else}
						<circle
							r="5"
							fill={UNDERWATER.bubbleFill}
							stroke={UNDERWATER.bubbleStroke}
							stroke-width="1"
						/>
						<path
							d="M -2.6,-1.4 A 3,3 0 0 1 -0.8,-3"
							fill="none"
							stroke={UNDERWATER.bubbleStroke}
							stroke-width="0.9"
							stroke-linecap="round"
						/>
					{/if}
				</svg>
			</div>
		{/each}
	</div>

	<!-- Pond floor: pondweed rises into view at the bottom of the page -->
	<div
		class="absolute inset-x-0 bottom-0"
		style="height: {FLOOR_HEIGHT_RATIO * 100}vh; opacity: 0;"
		data-pond-layer
		bind:this={floorEls[index]}
	>
		{#each POND_FLOOR[side].weeds as weed, w (w)}
			<svg
				viewBox="-20 {-weed.height} 40 {weed.height}"
				width="40"
				height={weed.height}
				class="anim-pond-weed absolute bottom-0 -translate-x-1/2 overflow-visible"
				style="left: {weed.x}%; animation-delay: {weed.delay}s;"
			>
				{#if gameDevMode.active}
					<g transform="translate(0, {-weed.height / 2})">
						<path
							d={weedPixelPath(weed.height)}
							fill={UNDERWATER.weedStroke}
							shape-rendering="crispEdges"
						/>
					</g>
				{:else}
					<path
						d={weedPath(weed.height)}
						fill="none"
						stroke={UNDERWATER.weedStroke}
						stroke-width="2"
						stroke-linecap="round"
					/>
				{/if}
			</svg>
		{/each}
	</div>
{/snippet}

<!-- Depth tint: the background glows into pond blue (#94b2ff) as you sink (behind content and flanks) -->
<div
	aria-hidden="true"
	class="pointer-events-none fixed inset-0 z-0 {isReturning ? 'pond-returning' : ''}"
	data-pond-layer
	style="opacity: 0; background: linear-gradient(180deg, rgba(148, 178, 255, 0) 0%, rgba(148, 178, 255, 0.08) 50%, rgba(148, 178, 255, 0.1) 100%);"
	bind:this={tintEl}
></div>

<!-- Left Flank -->
<aside
	aria-hidden="true"
	class="pointer-events-none fixed inset-y-0 z-0 w-32 opacity-10 transition-all duration-300 ease-in-out sm:w-48 sm:opacity-75 md:w-60 lg:w-72 lg:opacity-100 {isOpen
		? 'left-0 md:left-52'
		: 'left-0'} {isReturning ? 'pond-returning' : ''}"
>
	{@render underwater('left', 0)}
	<div class="relative size-full" data-pond-layer bind:this={leftFlankEl}>
		{#each LEFT_SHARDS as shard, i (shard.id)}
			{@render pondItem(shard, currentLayout.left[i], true)}
		{/each}
	</div>
</aside>

<!-- Right Flank -->
<aside
	aria-hidden="true"
	class="pointer-events-none fixed inset-y-0 right-0 z-0 w-32 opacity-10 transition-opacity duration-700 sm:w-48 sm:opacity-75 md:w-64 lg:w-80 lg:opacity-100 {isReturning
		? 'pond-returning'
		: ''}"
>
	{@render underwater('right', 1)}
	<div class="relative size-full" data-pond-layer bind:this={rightFlankEl}>
		{#each RIGHT_SHARDS as shard, i (shard.id)}
			{@render pondItem(shard, currentLayout.right[i], false)}
		{/each}
	</div>
</aside>
