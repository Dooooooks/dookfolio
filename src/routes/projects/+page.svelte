<script lang="ts">
	import { ArrowLeft, ExternalLink, FolderGit2 } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Projects — Lloyd Nicolas</title>
</svelte:head>

<section class="relative flex min-h-screen flex-col px-8 py-16 pb-[40vh] md:px-12">
	<a
		href={resolve('/')}
		class="absolute top-8 left-8 md:top-10 md:left-12 inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-white"
	>
		<ArrowLeft class="size-4" />
		Back to Home
	</a>

	<div class="mx-auto my-auto w-full max-w-4xl">
		<h1 class="text-3xl font-extrabold">Projects</h1>

		{#if data.error}
			<p class="mt-4 text-sm text-muted">{data.error}</p>
		{:else if data.projects.length === 0}
			<p class="mt-4 text-sm text-muted">No projects yet. Add some from the admin dashboard.</p>
		{:else}
			<div class="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
			{#each data.projects as project (project.id)}
				<article
					class="group flex flex-col overflow-hidden rounded-xl border border-white/8 bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-accent/30"
				>
					<div class="relative aspect-[16/10] w-full overflow-hidden bg-bg">
						{#if project.cover_url}
							<img
								src={project.cover_url}
								alt={project.title}
								class="size-full object-cover transition-transform duration-300 group-hover:scale-105"
							/>
						{:else}
							<div class="flex size-full items-center justify-center text-muted/30">
								<span class="text-xs font-bold">No Image</span>
							</div>
						{/if}
					</div>

					<div class="flex flex-1 flex-col p-3.5">
						<div class="flex items-start justify-between gap-2">
							<h2 class="text-sm font-extrabold text-white transition-colors group-hover:text-accent">
								{project.title}
							</h2>
							<div class="flex shrink-0 items-center gap-1.5">
								{#if project.demo_url}
									<a
										href={project.demo_url}
										rel="external"
										target="_blank"
										title="Demo"
										class="text-muted transition-colors hover:text-accent"
									>
										<ExternalLink class="size-3.5" />
									</a>
								{/if}
								{#if project.github_url}
									<a
										href={project.github_url}
										rel="external"
										target="_blank"
										title="GitHub"
										class="text-muted transition-colors hover:text-accent"
									>
										<FolderGit2 class="size-3.5" />
									</a>
								{/if}
							</div>
						</div>

						<p class="mt-1 text-xs leading-relaxed text-muted line-clamp-3">
							{project.description}
						</p>
					</div>
				</article>
			{/each}
		</div>
		{/if}
	</div>
</section>
