<script lang="ts">
	import { ArrowRight, ExternalLink } from '@lucide/svelte';
	import { getProjects } from '$lib/data';
	import { openProjectModal } from '$lib/project-modal.svelte';
	import { gameDevMode } from '$lib/game-mode.svelte';
	import { base, resolve } from '$app/paths';
	import { reveal } from '$lib/actions/reveal';

	// 3 latest projects sorted by date
	const latestProjects = getProjects().slice(0, 3);
	let hoveredIndex = $state<number | null>(null);
	let revealedCards = $state<boolean[]>([false, false, false]);
</script>

<div id="latest" class="mt-20 scroll-mt-24">
	<!-- Section Header -->
	<div class="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
		<div>
			<h3
				use:reveal={{ y: 20 }}
				class="text-xl font-extrabold text-white md:text-2xl {gameDevMode.active
					? 'font-pixel text-lg'
					: ''}"
			>
				Latest Projects
			</h3>
			<p
				use:reveal={{ delay: 60, y: 16 }}
				class="mt-1 text-xs text-muted md:text-sm {gameDevMode.active
					? 'font-pixel text-[8px]'
					: ''}"
			>
				Handcrafted web applications, tools, and game releases
			</p>
		</div>

		<!-- Direct Link to All Projects -->
		<a
			href={resolve('/projects')}
			use:reveal={{ delay: 80, y: 16 }}
			class="group mt-2 sm:mt-0 inline-flex items-center gap-1.5 text-xs font-bold text-accent transition-colors hover:text-white {gameDevMode.active
				? 'font-pixel text-[8.5px]'
				: ''}"
		>
			<span>View All Projects</span>
			<ArrowRight class="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
		</a>
	</div>

	<!-- Fan-Shaped Cards Arena -->
	<div
		class="relative mt-8 mb-4 flex h-[410px] sm:h-[450px] w-full items-center justify-center overflow-visible select-none"
	>
		{#each latestProjects as project, i (project.id)}
			{@const isHovered = hoveredIndex === i}
			{@const isDimmed = hoveredIndex !== null && !isHovered}

			<div
				use:reveal={{
					custom: true,
					delay: 100 + i * 120,
					onReveal: () => {
						revealedCards[i] = true;
					}
				}}
				role="button"
				tabindex="0"
				onclick={() => openProjectModal(project)}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						openProjectModal(project);
					}
				}}
				onmouseenter={() => (hoveredIndex = i)}
				onmouseleave={() => (hoveredIndex = null)}
				onfocus={() => (hoveredIndex = i)}
				onblur={() => (hoveredIndex = null)}
				class="fan-card fan-card-{i} group absolute flex h-[350px] sm:h-[390px] w-56 sm:w-68 md:w-74 cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface/90 shadow-2xl backdrop-blur-md hover:border-accent/60 transition-all duration-300 ease-out will-change-transform {revealedCards[i]
					? 'is-revealed'
					: ''} {isHovered ? 'is-hovered' : ''} {isDimmed ? 'is-dimmed' : ''}"
				data-revealed={revealedCards[i] ? 'true' : undefined}
				style="--fan-delay: {100 + i * 120}ms;"
			>
				<!-- Project Thumbnail -->
				<div class="relative h-40 sm:h-44 w-full shrink-0 overflow-hidden bg-bg">
					{#if project.cover_url}
						<img
							src="{base}{project.cover_url}"
							alt={project.title}
							loading="lazy"
							decoding="async"
							class="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-108"
						/>
					{:else}
						<div class="flex size-full items-center justify-center text-muted/40">
							<span class="text-xs font-bold">No Image</span>
						</div>
					{/if}

					<!-- Gradient Overlay at bottom of image -->
					<div
						class="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-surface/95 via-surface/40 to-transparent"
					></div>

					<!-- Date Badge -->
					{#if project.date}
						<span
							class="absolute top-2.5 right-2.5 rounded-md border border-white/10 bg-black/60 px-2 py-0.5 text-[9.5px] font-extrabold text-white backdrop-blur-xs {gameDevMode.active
								? 'font-pixel text-[7.5px]'
								: ''}"
						>
							{project.date}
						</span>
					{/if}
				</div>

				<!-- Card Content -->
				<div class="flex flex-1 flex-col justify-between p-4 sm:p-5">
					<div>
						<!-- Title -->
						<h4
							class="line-clamp-1 text-sm sm:text-base font-extrabold text-white transition-colors group-hover:text-accent {gameDevMode.active
								? 'font-pixel text-[10px] sm:text-xs'
								: ''}"
						>
							{project.title}
						</h4>

						<!-- Description Snippet -->
						<p
							class="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted {gameDevMode.active
								? 'text-[8px] leading-normal'
								: ''}"
						>
							{project.description}
						</p>
					</div>

					<!-- Bottom Row: Tags & Click indicator -->
					<div class="mt-3 flex items-center justify-between gap-2 border-t border-white/6 pt-2.5">
						<!-- Tags -->
						<div class="flex flex-wrap gap-1 overflow-hidden">
							{#each (project.tags || []).slice(0, 2) as tag}
								<span
									class="rounded-md border border-white/8 bg-white/4 px-1.5 py-0.5 text-[9px] font-bold text-muted group-hover:border-accent/30 group-hover:text-accent/90 {gameDevMode.active
										? 'font-pixel text-[7px]'
										: ''}"
								>
									{tag}
								</span>
							{/each}
						</div>

						<!-- Details prompt -->
						<span
							class="inline-flex shrink-0 items-center gap-1 text-[11px] font-extrabold text-accent transition-transform duration-200 group-hover:translate-x-0.5 {gameDevMode.active
								? 'font-pixel text-[8px]'
								: ''}"
						>
							View
							<ArrowRight class="size-3" />
						</span>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	/* Initial resting state before scroll reveal: gathered slightly lower and centered */
	.fan-card {
		opacity: 0;
		transform: translate3d(0, 44px, 0) rotate(0deg) scale(0.92);
		transition:
			opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1),
			transform 0.75s cubic-bezier(0.22, 1.25, 0.36, 1);
		transition-delay: var(--fan-delay, 0ms);
		will-change: transform, opacity;
	}

	/* Revealed state: fan cards pop up and fan out to their individual slot positions */
	.fan-card.is-revealed,
	.fan-card[data-revealed='true'] {
		opacity: 1 !important;
		transform: translate3d(var(--tx), var(--ty), 0) rotate(var(--rot)) scale(1);
	}

	/* Slot transforms for the 3 fanned cards */
	.fan-card-0 {
		--rot: -8deg;
		--tx: -135px;
		--ty: 14px;
		z-index: 10;
	}

	.fan-card-1 {
		--rot: 0deg;
		--tx: 0px;
		--ty: -6px;
		z-index: 20;
	}

	.fan-card-2 {
		--rot: 8deg;
		--tx: 135px;
		--ty: 14px;
		z-index: 10;
	}

	/* Mobile adjustments for tighter screen widths */
	@media (max-width: 640px) {
		.fan-card-0 {
			--rot: -6deg;
			--tx: -64px;
			--ty: 8px;
		}

		.fan-card-1 {
			--rot: 0deg;
			--tx: 0px;
			--ty: -4px;
		}

		.fan-card-2 {
			--rot: 6deg;
			--tx: 64px;
			--ty: 8px;
		}
	}

	/* Reset transition delay on interaction so hover is immediate */
	.fan-card.is-revealed:hover,
	.fan-card.is-hovered {
		transition-delay: 0ms !important;
	}

	/* Interactive hover elevation and straightening */
	.fan-card.is-hovered {
		--rot: 0deg !important;
		--ty: -24px !important;
		transform: translate3d(var(--tx), var(--ty), 0) rotate(var(--rot)) scale(1.05) !important;
		z-index: 35 !important;
		box-shadow:
			0 20px 30px -10px rgba(0, 0, 0, 0.7),
			0 0 25px 2px rgba(182, 148, 255, 0.25);
	}

	.fan-card.is-dimmed {
		opacity: 0.65;
		filter: brightness(0.85);
		transform: translate3d(var(--tx), var(--ty), 0) rotate(var(--rot)) scale(0.96);
	}
</style>
