<script lang="ts">
	import { ArrowLeft, ArrowRight, Calendar, ExternalLink, FolderGit2 } from '@lucide/svelte';
	import { base, resolve } from '$app/paths';
	import { openProjectModal } from '$lib/project-modal.svelte';
	import { reveal } from '$lib/actions/reveal';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatDate(dateStr?: string) {
		if (!dateStr) return '';
		const [year, month] = dateStr.split('-');
		if (!year || !month) return dateStr;
		const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		const mIdx = parseInt(month, 10) - 1;
		return mIdx >= 0 && mIdx < 12 ? `${months[mIdx]} ${year}` : dateStr;
	}
</script>

<svelte:head>
	<title>Projects — Lloyd Nicolas</title>
</svelte:head>

<section class="relative flex min-h-screen flex-col px-4 py-12 pb-[40vh] sm:px-6 md:px-12">
	<div class="mx-auto w-full max-w-3xl pt-6 sm:pt-0">
		<a
			href={resolve('/')}
			use:reveal={{ y: -10 }}
			class="group mb-8 inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-white"
		>
			<ArrowLeft class="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
			Back to Home
		</a>

		<div use:reveal={{ y: 22 }}>
			<h1 class="text-3xl font-extrabold md:text-4xl">Projects</h1>
			<p class="mt-2 text-sm text-muted md:text-base">
				Selected web applications, tools, and game projects.
			</p>
		</div>

		{#if data.projects.length === 0}
			<p use:reveal={{ delay: 100, y: 16 }} class="mt-8 text-sm text-muted">
				No projects yet.
			</p>
		{:else}
			<div class="mt-8 grid gap-5 sm:grid-cols-2">
				{#each data.projects as project, i (project.title)}
					<div
						use:reveal={{ delay: 80 + i * 60, y: 24, scale: 0.96 }}
						role="button"
						tabindex="0"
						onclick={() => openProjectModal(project)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								openProjectModal(project);
							}
						}}
						class="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/8 bg-surface/70 backdrop-blur-xs transition-all duration-300 hover:-translate-y-2 hover:border-accent/40 hover:bg-surface/90 hover:shadow-2xl hover:shadow-accent/10 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-hidden"
					>
						<!-- Media Banner with Top Glass Badges & Base Gradient -->
						<div class="relative aspect-[16/10] w-full overflow-hidden bg-bg">
							{#if project.cover_url}
								<img
									src="{base}{project.cover_url}"
									alt={project.title}
									loading="lazy"
									decoding="async"
									class="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-108"
								/>
							{:else}
								<div class="flex size-full items-center justify-center text-muted/30">
									<span class="text-xs font-bold">No Image</span>
								</div>
							{/if}

							<!-- Bottom Gradient Overlay -->
							<div
								class="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface via-surface/25 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-60"
							></div>

							<!-- Floating Glass Date Badge -->
							{#if project.date}
								<span
									class="absolute top-3 left-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-bg/85 px-2.5 py-1 text-[11px] font-bold text-muted/90 backdrop-blur-md"
								>
									<Calendar class="size-3 text-accent/80" />
									<span>{formatDate(project.date)}</span>
								</span>
							{/if}

							<!-- Floating Primary Tag Badge -->
							{#if project.tags && project.tags.length > 0}
								<span
									class="absolute top-3 right-3 rounded-full border border-accent/30 bg-accent/20 px-2.5 py-1 text-[11px] font-extrabold text-white backdrop-blur-md shadow-xs shadow-accent/20"
								>
									{project.tags[0]}
								</span>
							{/if}
						</div>

						<!-- Card Content -->
						<div class="flex flex-1 flex-col justify-between p-5">
							<div>
								<div class="flex items-start justify-between gap-3">
									<h2
										class="text-base font-extrabold text-white transition-colors group-hover:text-accent sm:text-lg"
									>
										{project.title}
									</h2>

									<!-- Quick Actions -->
									<div class="flex shrink-0 items-center gap-1.5">
										{#if project.demo_url}
											<a
												href={project.demo_url}
												rel="external"
												target="_blank"
												title="Live Demo"
												onclick={(e) => e.stopPropagation()}
												class="flex size-7 items-center justify-center rounded-lg border border-white/8 bg-white/4 text-muted transition-all duration-200 hover:scale-110 hover:border-accent/40 hover:bg-accent/15 hover:text-accent"
											>
												<ExternalLink class="size-3.5" />
											</a>
										{/if}
										{#if project.github_url}
											<a
												href={project.github_url}
												rel="external"
												target="_blank"
												title="GitHub Repository"
												onclick={(e) => e.stopPropagation()}
												class="flex size-7 items-center justify-center rounded-lg border border-white/8 bg-white/4 text-muted transition-all duration-200 hover:scale-110 hover:border-accent/40 hover:bg-accent/15 hover:text-accent"
											>
												<FolderGit2 class="size-3.5" />
											</a>
										{/if}
									</div>
								</div>

								<p class="mt-2 line-clamp-3 text-xs leading-relaxed text-muted sm:text-sm">
									{project.description}
								</p>
							</div>

							<!-- Tag Rail & Details Indicator -->
							<div class="mt-4 flex items-center justify-between border-t border-white/6 pt-3.5">
								{#if project.tags && project.tags.length > 0}
									<div class="flex flex-wrap items-center gap-1.5">
										{#each project.tags.slice(0, 3) as tag}
											<span
												class="inline-flex items-center gap-1 rounded-md border border-white/6 bg-white/4 px-2 py-0.5 text-[11px] font-bold text-muted transition-colors group-hover:border-accent/20 group-hover:text-accent/90"
											>
												<span class="size-1 rounded-full bg-accent/60"></span>
												{tag}
											</span>
										{/each}
										{#if project.tags.length > 3}
											<span class="text-[10px] font-bold text-muted/60">
												+{project.tags.length - 3}
											</span>
										{/if}
									</div>
								{/if}

								<span
									class="ml-auto inline-flex items-center gap-1 text-xs font-bold text-muted/80 transition-colors group-hover:text-accent"
								>
									<span>Details</span>
									<ArrowRight
										class="size-3 transition-transform duration-200 group-hover:translate-x-1"
									/>
								</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</section>
