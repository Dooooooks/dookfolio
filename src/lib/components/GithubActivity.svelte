<script lang="ts">
	import { onMount } from 'svelte';
	import { ExternalLink } from '@lucide/svelte';
	import { reveal } from '$lib/actions/reveal';
	import type { ContributionCalendar, ContributionDay } from '$lib/server/github';

	let {
		contributions
	}: {
		contributions: ContributionCalendar;
	} = $props();

	// Guard against month collision: if the 1st month is too close to the 2nd month (< 3 columns, ~39px),
	// dynamically omit the 1st month so labels never touch.
	const visibleMonths = $derived.by(() => {
		const months = contributions.months || [];
		if (months.length > 1 && months[1].colIndex - months[0].colIndex < 3) {
			return months.slice(1);
		}
		return months;
	});

	let scrollContainerEl = $state<HTMLElement | null>(null);
	let canScrollLeft = $state(false);
	let canScrollRight = $state(false);

	function checkScroll() {
		if (!scrollContainerEl) return;
		const { scrollLeft, scrollWidth, clientWidth } = scrollContainerEl;
		canScrollLeft = scrollLeft > 8;
		canScrollRight = scrollLeft + clientWidth < scrollWidth - 8;
	}

	function handleScroll() {
		tooltip.visible = false;
		checkScroll();
	}

	onMount(() => {
		if (scrollContainerEl) {
			// On mobile, start scrolled to the most recent contributions
			if (window.innerWidth < 768) {
				scrollContainerEl.scrollLeft = scrollContainerEl.scrollWidth;
			}
			checkScroll();
		}
	});

	// Hover tooltip state
	let tooltip = $state<{
		visible: boolean;
		text: string;
		x: number;
		y: number;
	}>({
		visible: false,
		text: '',
		x: 0,
		y: 0
	});

	function formatFullDate(dateStr: string): string {
		const [year, month, day] = dateStr.split('-').map(Number);
		const d = new Date(Date.UTC(year, month - 1, day));
		return d.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			timeZone: 'UTC'
		});
	}

	const LEVEL_COLORS = [
		'#1a1827', // Level 0: deep slate-purple background
		'#3d2b6b', // Level 1: subtle dark purple
		'#6340ba', // Level 2: medium rich purple
		'#946bf2', // Level 3: vibrant purple
		'#b694ff' // Level 4: site accent purple
	];

	function getCellColor(level: number): string {
		return LEVEL_COLORS[level] || LEVEL_COLORS[0];
	}

	function handleCellMouseEnter(day: ContributionDay, event: MouseEvent) {
		const target = event.currentTarget as SVGGraphicsElement;
		const rect = target.getBoundingClientRect();
		const containerRect = (
			target.closest('.heatmap-container') as HTMLElement
		)?.getBoundingClientRect();

		if (containerRect) {
			const countText =
				day.count === 0
					? 'No contributions'
					: `${day.count} contribution${day.count === 1 ? '' : 's'}`;
			const rawX = rect.left - containerRect.left + rect.width / 2;
			// Clamp tooltip x inside container so it never bleeds beyond screen edges
			const clampedX = Math.max(70, Math.min(rawX, containerRect.width - 70));
			tooltip = {
				visible: true,
				text: `${countText} on ${formatFullDate(day.date)}`,
				x: clampedX,
				y: rect.top - containerRect.top - 8
			};
		}
	}

	function handleCellMouseLeave() {
		tooltip.visible = false;
	}
</script>

<section id="activity" class="mt-20 px-4 pt-4 pb-12 sm:px-6 md:mt-24 md:px-12 md:pt-6 md:pb-16">
	<div class="mx-auto w-full max-w-3xl min-w-0">
		<!-- Section Header -->
		<div use:reveal={{ y: 20 }} class="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
			<div class="flex flex-wrap items-center gap-2 sm:gap-3">
				<h2 class="text-2xl font-extrabold md:text-3xl">Activity</h2>
				<span
					class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent shadow-xs shadow-accent/20"
				>
					<span class="size-1.5 animate-pulse rounded-full bg-accent"></span>
					{contributions.total} contributions in {contributions.year}
				</span>
			</div>

			<a
				href="https://github.com/Dooooooks"
				target="_blank"
				rel="external noreferrer"
				class="group flex items-center gap-1.5 text-xs font-bold text-muted transition-colors hover:text-white"
			>
				@Dooooooks
				<ExternalLink
					class="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
				/>
			</a>
		</div>

		<!-- GitHub Contribution Heatmap -->
		<div use:reveal={{ delay: 100, y: 24 }} class="heatmap-container relative mt-6 w-full max-w-full min-w-0 overflow-hidden">
			<!-- Smooth Edge Fade Gradient Cues for Horizontal Scroll on Mobile -->
			{#if canScrollLeft}
				<div class="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-bg to-transparent transition-opacity duration-200"></div>
			{/if}
			{#if canScrollRight}
				<div class="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-bg to-transparent transition-opacity duration-200"></div>
			{/if}

			<!-- Responsive Scroll Container -->
			<div
				bind:this={scrollContainerEl}
				onscroll={handleScroll}
				class="scrollbar-thin w-full max-w-full min-w-0 overflow-x-auto pb-2 overscroll-x-contain touch-pan-x"
			>
				<div class="min-w-[720px]">
					<svg
						viewBox="0 0 735 125"
						class="h-auto w-full overflow-visible select-none"
						aria-label="GitHub Contributions Heatmap"
					>
						<!-- Month Labels -->
						{#each visibleMonths as month (month.name + month.colIndex)}
							<text x={32 + month.colIndex * 13} y="13" class="fill-muted text-[10px] font-bold">
								{month.name}
							</text>
						{/each}

						<!-- Day Labels (Mon, Wed, Fri aligned with rows 1, 3, 5) -->
						<text x="0" y="44" class="fill-muted text-[10px] font-bold">Mon</text>
						<text x="0" y="70" class="fill-muted text-[10px] font-bold">Wed</text>
						<text x="0" y="96" class="fill-muted text-[10px] font-bold">Fri</text>

						<!-- Weeks Grid -->
						{#each contributions.weeks as week, colIndex (colIndex)}
							<g transform="translate({32 + colIndex * 13}, 22)">
								{#each week as day, rowIndex (rowIndex + '-' + (day ? day.date : 'empty'))}
									{#if day}
										<rect
											x="0"
											y={rowIndex * 13}
											width="10"
											height="10"
											rx="2"
											fill={getCellColor(day.level)}
											stroke={day.level === 0
												? 'rgba(255, 255, 255, 0.05)'
												: day.level === 4
													? '#cbb1ff'
													: 'transparent'}
											stroke-width={day.level === 0 ? 0.75 : day.level === 4 ? 0.5 : 0}
											class="cursor-pointer transition-colors duration-100 hover:stroke-white hover:stroke-1 focus:stroke-white focus:stroke-1 focus:outline-none"
											role="button"
											tabindex="0"
											aria-label="{day.count} contributions on {day.date}"
											onmouseenter={(e) => handleCellMouseEnter(day, e)}
											onmouseleave={handleCellMouseLeave}
											onfocus={(e) => handleCellMouseEnter(day, e as unknown as MouseEvent)}
											onblur={handleCellMouseLeave}
										>
											<title>{day.count} contributions on {day.date}</title>
										</rect>
									{/if}
								{/each}
							</g>
						{/each}
					</svg>
				</div>
			</div>

			<!-- Floating Tooltip -->
			{#if tooltip.visible}
				<div
					class="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full rounded-md border border-accent/40 bg-[#171526] px-2.5 py-1 text-[11px] font-bold text-white shadow-xl shadow-black/80 transition-all duration-100"
					style="left: {tooltip.x}px; top: {tooltip.y}px;"
				>
					{tooltip.text}
					<div
						class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#171526]"
					></div>
				</div>
			{/if}

			<!-- Heatmap Footer -->
			<div class="mt-3 flex flex-wrap items-center justify-between gap-3 pt-1">

				<!-- Legend: Less [0][1][2][3][4] More -->
				<div class="flex items-center gap-1.5 text-xs font-bold text-muted">
					<span>Less</span>
					<span
						class="size-2.5 rounded-[2px] border border-white/5"
						style="background-color: {LEVEL_COLORS[0]};"
						title="No contributions"
					></span>
					<span
						class="size-2.5 rounded-[2px]"
						style="background-color: {LEVEL_COLORS[1]};"
						title="Level 1"
					></span>
					<span
						class="size-2.5 rounded-[2px]"
						style="background-color: {LEVEL_COLORS[2]};"
						title="Level 2"
					></span>
					<span
						class="size-2.5 rounded-[2px]"
						style="background-color: {LEVEL_COLORS[3]};"
						title="Level 3"
					></span>
					<span
						class="size-2.5 rounded-[2px] shadow-xs shadow-accent/40"
						style="background-color: {LEVEL_COLORS[4]};"
						title="Level 4"
					></span>
					<span>More</span>
				</div>

				<!-- Mobile swipe cue -->
				<div class="flex items-center gap-1 text-[10px] font-bold text-muted/70 md:hidden">
					<span>← Swipe to explore full year →</span>
				</div>
			</div>
		</div>
	</div>
</section>
