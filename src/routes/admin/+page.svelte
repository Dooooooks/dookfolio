<script lang="ts">
	import { Briefcase, Newspaper, PenLine, Plus, Trash2 } from '@lucide/svelte';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let activeTab = $state<'projects' | 'experiences'>('projects');

	$effect(() => {
		if (page.url.searchParams.get('tab') === 'experiences') {
			activeTab = 'experiences';
		} else {
			activeTab = 'projects';
		}
	});
</script>

<svelte:head>
	<title>Admin — Lloyd Nicolas</title>
</svelte:head>

<div class="flex flex-wrap items-center justify-between gap-4">
	<div class="flex items-center gap-2 rounded-xl bg-surface p-1 border border-white/5">
		<button
			type="button"
			onclick={() => (activeTab = 'projects')}
			class="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-extrabold transition-colors {activeTab ===
			'projects'
				? 'bg-accent text-bg'
				: 'text-muted hover:bg-white/5 hover:text-white'}"
		>
			<Newspaper class="size-4" />
			Projects ({data.projects.length})
		</button>
		<button
			type="button"
			onclick={() => (activeTab = 'experiences')}
			class="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-extrabold transition-colors {activeTab ===
			'experiences'
				? 'bg-accent text-bg'
				: 'text-muted hover:bg-white/5 hover:text-white'}"
		>
			<Briefcase class="size-4" />
			Experiences ({data.experiences.length})
		</button>
	</div>

	{#if activeTab === 'projects'}
		<a
			href={resolve('/admin/new')}
			class="flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-extrabold text-bg transition-opacity hover:opacity-90"
		>
			<Plus class="size-4" />
			New Project
		</a>
	{:else}
		<a
			href={resolve('/admin/experiences/new')}
			class="flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-extrabold text-bg transition-opacity hover:opacity-90"
		>
			<Plus class="size-4" />
			New Experience
		</a>
	{/if}
</div>

{#if data.error}
	<p class="mt-6 text-sm text-muted">{data.error}</p>
{/if}

{#if activeTab === 'projects'}
	{#if data.projects.length === 0}
		<p class="mt-8 text-sm text-muted">No projects yet. Create your first one.</p>
	{:else}
		<ul class="mt-8 space-y-4">
			{#each data.projects as project (project.id)}
				<li class="flex items-center gap-4 rounded-xl border border-white/5 bg-surface p-4">
					{#if project.cover_url}
						<img
							src={project.cover_url}
							alt={project.title}
							class="size-14 shrink-0 rounded-lg border border-white/5 object-cover"
						/>
					{:else}
						<div class="size-14 shrink-0 rounded-lg bg-bg"></div>
					{/if}

					<div class="min-w-0 flex-1">
						<p class="truncate font-extrabold">{project.title}</p>
						<p class="truncate text-sm text-muted">
							{project.tags.join(' · ')}
						</p>
					</div>

					<a
						href={resolve('/admin/edit/[id]', { id: project.id })}
						aria-label="Edit {project.title}"
						class="cursor-pointer rounded-lg p-2 text-muted transition-colors hover:bg-white/5 hover:text-accent"
					>
						<PenLine class="size-4.5" />
					</a>

					<form
						method="POST"
						action="?/delete"
						onsubmit={(event) => {
							if (!confirm('Delete this project?')) event.preventDefault();
						}}
					>
						<input type="hidden" name="id" value={project.id} />
						<button
							type="submit"
							aria-label="Delete {project.title}"
							class="cursor-pointer rounded-lg p-2 text-muted transition-colors hover:bg-red-400/10 hover:text-red-400"
						>
							<Trash2 class="size-4.5" />
						</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
{:else}
	{#if data.experiences.length === 0}
		<p class="mt-8 text-sm text-muted">No experiences yet. Create your first one.</p>
	{:else}
		<ul class="mt-8 space-y-4">
			{#each data.experiences as exp (exp.id)}
				<li class="flex items-center gap-4 rounded-xl border border-white/5 bg-surface p-4">
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							<p class="truncate font-extrabold">{exp.role}</p>
							<span class="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
								{exp.period}
							</span>
						</div>
						<p class="mt-0.5 truncate text-sm text-accent">{exp.company}</p>
						<p class="mt-1 line-clamp-1 text-xs text-muted">{exp.description}</p>
					</div>

					<a
						href={resolve('/admin/experiences/edit/[id]', { id: exp.id })}
						aria-label="Edit {exp.role}"
						class="cursor-pointer rounded-lg p-2 text-muted transition-colors hover:bg-white/5 hover:text-accent"
					>
						<PenLine class="size-4.5" />
					</a>

					<form
						method="POST"
						action="?/deleteExperience"
						onsubmit={(event) => {
							if (!confirm('Delete this experience?')) event.preventDefault();
						}}
					>
						<input type="hidden" name="id" value={exp.id} />
						<button
							type="submit"
							aria-label="Delete {exp.role}"
							class="cursor-pointer rounded-lg p-2 text-muted transition-colors hover:bg-red-400/10 hover:text-red-400"
						>
							<Trash2 class="size-4.5" />
						</button>
					</form>
				</li>
			{/each}
		</ul>
	{/if}
{/if}
