<script lang="ts">
	import { ExternalLink } from '@lucide/svelte';
	import type { ContributionCalendar, ContributionDay } from '$lib/server/github';

	let {
		contributions
	}: {
		contributions: ContributionCalendar;
	} = $props();

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
			tooltip = {
				visible: true,
				text: `${countText} on ${formatFullDate(day.date)}`,
				x: rect.left - containerRect.left + rect.width / 2,
				y: rect.top - containerRect.top - 8
			};
		}
	}

	function handleCellMouseLeave() {
		tooltip.visible = false;
	}
</script>

<section id="activity" class="mt-18 px-8 pt-4 pb-12 md:px-12 md:pt-6 md:pb-16">
	<div class="mx-auto w-full max-w-3xl">
		<!-- Section Header -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<h2 class="text-2xl font-extrabold md:text-3xl">Activity</h2>
				<span
					class="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent shadow-xs shadow-accent/20"
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
		<div class="heatmap-container anim-fade-in-up relative mt-6">
			<!-- Responsive Scroll Container -->
			<div class="scrollbar-thin overflow-x-auto pb-2">
				<div class="min-w-[690px]">
					<svg
						viewBox="0 0 735 125"
						class="h-auto w-full overflow-visible select-none"
						aria-label="GitHub Contributions Heatmap"
					>
						<!-- Month Labels -->
						{#each contributions.months as month (month.name + month.colIndex)}
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
				<a
					href="https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/managing-contribution-settings-on-your-profile/why-are-my-contributions-not-showing-up-on-my-profile"
					target="_blank"
					rel="external noreferrer"
					class="text-xs font-semibold text-muted transition-colors hover:text-accent"
				>
					Learn how we count contributions
				</a>

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
			</div>
		</div>
	</div>
</section>
