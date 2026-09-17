<script lang="ts">
	import { ArrowRight, Calendar, Clock } from '@lucide/svelte';
	import { base, resolve } from '$app/paths';
	import { getLatestBlogs } from '$lib/blogs';
	import { gameDevMode } from '$lib/game-mode.svelte';
	import { reveal } from '$lib/actions/reveal';

	// Exactly 5 latest blogs for home page
	const latestBlogs = getLatestBlogs(5);
</script>

<div id="blogs" class="mt-20 scroll-mt-24">
	<!-- Section Header -->
	<div class="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
		<div>
			<h3
				use:reveal={{ y: 20 }}
				class="text-xl font-extrabold text-white md:text-2xl {gameDevMode.active
					? 'font-pixel text-lg'
					: ''}"
			>
				Latest Blogs
			</h3>
			<p
				use:reveal={{ delay: 60, y: 16 }}
				class="mt-1 text-xs text-muted md:text-sm {gameDevMode.active
					? 'font-pixel text-[8px]'
					: ''}"
			>
				Devlogs, computer vision thesis findings, and tech reflections
			</p>
		</div>

		<!-- Direct Link to All Blogs -->
		<a
			href={resolve('/blogs')}
			use:reveal={{ delay: 80, y: 16 }}
			class="group mt-2 sm:mt-0 inline-flex items-center gap-1.5 text-xs font-bold text-accent transition-colors hover:text-white {gameDevMode.active
				? 'font-pixel text-[8.5px]'
				: ''}"
		>
			<span>View All Blogs</span>
			<ArrowRight class="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
		</a>
	</div>

	<!-- 5 Blogs Terminal Devlog Feed -->
	{#if latestBlogs.length === 0}
		<div
			use:reveal={{ delay: 80, y: 16 }}
			class="mt-6 flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-surface/40 px-6 py-12 text-center backdrop-blur-xs"
		>
			<p class="font-medium text-muted {gameDevMode.active ? 'font-pixel text-[9.5px]' : 'text-sm sm:text-base'}">
				No blog posts published at this time.
			</p>
			<p class="mt-1.5 text-xs text-muted/60 {gameDevMode.active ? 'font-pixel text-[7.5px]' : ''}">
				Please check back soon for upcoming articles and devlog entries.
			</p>
		</div>
	{:else}
		<div class="mt-6 divide-y divide-white/6 rounded-2xl border border-white/8 bg-surface/50 backdrop-blur-xs">
			{#each latestBlogs as blog, i (blog.slug)}
			<a
				href={resolve(`/blogs/${blog.slug}`)}
				use:reveal={{ delay: 60 + i * 40, y: 14, scale: 0.99 }}
				class="group relative flex flex-col gap-1.5 p-3.5 transition-all duration-200 hover:bg-accent/10 sm:p-4.5 {i === 0 ? 'rounded-t-2xl' : ''} {i === latestBlogs.length - 1 ? 'rounded-b-2xl' : ''}"
			>
				<div class="flex items-start justify-between gap-3">
					<div class="flex min-w-0 flex-1 items-start gap-2.5 sm:gap-3">
						<!-- Terminal Cursor Prompt -->
						<span
							class="mt-0.5 shrink-0 font-mono text-xs font-bold text-accent/50 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-accent group-hover:drop-shadow-[0_0_6px_rgba(182,148,255,0.7)]"
						>
							&gt;
						</span>

						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
								<!-- Date in Brackets -->
								<span class="shrink-0 font-mono text-xs font-bold text-accent/80 tracking-tight">
									[{blog.date}]
								</span>

								<!-- Title -->
								<h4
									class="font-extrabold text-white transition-colors duration-150 group-hover:text-accent text-sm {gameDevMode.active
										? 'font-pixel text-[10px] sm:text-xs'
										: ''}"
								>
									{blog.title}
								</h4>
							</div>

							<!-- Snippet Description -->
							<p class="mt-1 line-clamp-1 text-xs leading-relaxed text-muted/80 {gameDevMode.active ? 'text-[8.5px]' : ''}">
								{blog.description}
							</p>

							<!-- Monospace Tag Pills & Read Time -->
							<div class="mt-2 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-muted">
								{#each blog.tags.slice(0, 3) as tag}
									<span class="rounded border border-white/6 bg-white/4 px-1.5 py-0.5 text-muted/90 group-hover:border-accent/20 group-hover:text-accent-soft {gameDevMode.active ? 'font-pixel text-[7px]' : ''}">
										#{tag}
									</span>
								{/each}
								<span class="text-white/20">•</span>
								<span class="text-muted/70">~{blog.readTime}</span>
							</div>
						</div>
					</div>

					<!-- Right Side: Compact Cover Thumbnail (if available) & Arrow -->
					<div class="flex shrink-0 items-center gap-3 self-center pl-2">
						{#if blog.cover}
							<div class="relative hidden h-10 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-bg transition-transform duration-300 group-hover:scale-105 sm:block">
								<img
									src="{blog.cover.startsWith('http') ? '' : base}{blog.cover}"
									alt=""
									loading="lazy"
									decoding="async"
									class="size-full object-cover"
								/>
							</div>
						{/if}

						<span
							class="flex size-6.5 items-center justify-center rounded-lg border border-white/6 bg-white/4 text-muted transition-all duration-200 group-hover:border-accent/40 group-hover:bg-accent/20 group-hover:text-accent group-hover:translate-x-0.5"
						>
							<ArrowRight class="size-3" />
						</span>
					</div>
				</div>
			</a>
		{/each}
	</div>
	{/if}
</div>
