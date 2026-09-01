<script lang="ts">
	import { ExternalLink, FolderGit2 } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<section class="min-h-screen px-8 py-12 md:px-12">
	<h1 class="text-3xl font-extrabold">Projects</h1>

	{#if data.error}
		<p class="mt-4 text-sm text-muted">{data.error}</p>
	{:else if data.projects.length === 0}
		<p class="mt-4 text-sm text-muted">No projects yet. Add some from the admin dashboard.</p>
	{:else}
		<div class="mt-8 grid gap-6 md:grid-cols-2">
			{#each data.projects as project (project.id)}
				<article class="overflow-hidden rounded-xl border border-white/5 bg-surface">
					{#if project.cover_url}
						<img
							src={project.cover_url}
							alt={project.title}
							class="aspect-video w-full object-cover"
						/>
					{:else}
						<div class="aspect-video w-full bg-bg"></div>
					{/if}

					<div class="p-5">
						<h2 class="text-lg font-extrabold">{project.title}</h2>
						<p class="mt-2 text-sm text-muted">{project.description}</p>

						{#if project.tags.length > 0}
							<ul class="mt-4 flex flex-wrap gap-2">
								{#each project.tags as tag (tag)}
									<li class="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent">
										{tag}
									</li>
								{/each}
							</ul>
						{/if}

						<div class="mt-4 flex gap-4">
							{#if project.demo_url}
								<a
									href={project.demo_url}
									rel="external"
									target="_blank"
									class="flex items-center gap-1.5 text-sm font-bold text-accent hover:underline"
								>
									<ExternalLink class="size-4" />
									Demo
								</a>
							{/if}
							{#if project.github_url}
								<a
									href={project.github_url}
									rel="external"
									target="_blank"
									class="flex items-center gap-1.5 text-sm font-bold text-accent hover:underline"
								>
									<FolderGit2 class="size-4" />
									GitHub
								</a>
							{/if}
						</div>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</section>
