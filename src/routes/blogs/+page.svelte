<script lang="ts">
	import { ArrowLeft, ArrowRight, Calendar, Clock } from '@lucide/svelte';
	import { base, resolve } from '$app/paths';
	import { gameDevMode } from '$lib/game-mode.svelte';
	import { reveal } from '$lib/actions/reveal';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Blogs — Lloyd Nicolas</title>
</svelte:head>

<!-- Blogs List Page -->
<div class="relative min-h-[calc(100vh-4rem)] px-6 py-12 sm:px-10 md:px-16">
	<!-- Back link -->
	<a
		href={resolve('/')}
		use:reveal={{ y: -10 }}
		class="group mb-8 inline-flex items-center gap-2 text-xs font-bold text-muted transition-colors hover:text-white"
	>
		<ArrowLeft class="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
		Back to Home
	</a>

	<div class="mx-auto my-auto w-full max-w-3xl pt-8 sm:pt-0">
		<!-- Header -->
		<div use:reveal={{ y: 20 }}>
			<div class="flex items-center justify-between gap-3">
				<h1
					class="text-3xl font-extrabold tracking-tight text-white md:text-4xl {gameDevMode.active
						? 'font-pixel text-xl sm:text-2xl'
						: ''}"
				>
					Blogs
				</h1>
				<span class="rounded-full border border-white/10 bg-surface px-2.5 py-0.5 font-mono text-xs text-muted">
					[{data.blogs.length} {data.blogs.length === 1 ? 'entry' : 'entries'}]
				</span>
			</div>

			<p class="mt-2 text-xs leading-relaxed text-muted sm:text-sm">
				Reflections on computer vision, systems architecture, and indie game prototypes.
			</p>
		</div>

		<!-- Devlog Feed -->
		{#if data.blogs.length === 0}
			<div
				use:reveal={{ delay: 100, y: 16 }}
				class="mt-8 flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-surface/40 px-6 py-14 text-center backdrop-blur-xs"
			>
				<p class="font-medium text-muted {gameDevMode.active ? 'font-pixel text-[9.5px]' : 'text-sm sm:text-base'}">
					No blog posts published at this time.
				</p>
				<p class="mt-1.5 text-xs text-muted/60 {gameDevMode.active ? 'font-pixel text-[7.5px]' : ''}">
					Please check back soon for upcoming articles and devlog entries.
				</p>
			</div>
		{:else}
			<div class="mt-8 divide-y divide-white/6 rounded-2xl border border-white/8 bg-surface/50 backdrop-blur-xs">
				{#each data.blogs as blog, i (blog.slug)}
					<a
						href={resolve(`/blogs/${blog.slug}`)}
						use:reveal={{ delay: 50 + i * 40, y: 14, scale: 0.99 }}
						class="group relative flex flex-col gap-2 p-4 transition-all duration-200 hover:bg-accent/10 sm:p-5 {i === 0 ? 'rounded-t-2xl' : ''} {i === data.blogs.length - 1 ? 'rounded-b-2xl' : ''}"
					>
						<!-- Top row: Prompt, Date, Title, Thumbnail & Arrow -->
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
										<h2
											class="font-extrabold text-white transition-colors duration-150 group-hover:text-accent text-sm sm:text-base {gameDevMode.active
												? 'font-pixel text-xs sm:text-sm'
												: ''}"
										>
											{blog.title}
										</h2>
									</div>

									<!-- Snippet Description -->
									<p class="mt-1 line-clamp-1 text-xs leading-relaxed text-muted/80">
										{blog.description}
									</p>

									<!-- Monospace Tag Pills & Read Time (Mobile and Desktop) -->
									<div class="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-muted">
										{#each blog.tags as tag}
											<span class="rounded border border-white/6 bg-white/4 px-1.5 py-0.5 text-muted/90 group-hover:border-accent/20 group-hover:text-accent-soft">
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
									<div class="relative hidden h-11 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-bg transition-transform duration-300 group-hover:scale-105 sm:block">
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
									class="flex size-7 items-center justify-center rounded-lg border border-white/6 bg-white/4 text-muted transition-all duration-200 group-hover:border-accent/40 group-hover:bg-accent/20 group-hover:text-accent group-hover:translate-x-0.5"
								>
									<ArrowRight class="size-3.5" />
								</span>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
