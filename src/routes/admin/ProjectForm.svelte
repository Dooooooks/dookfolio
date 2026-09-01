<script lang="ts">
	import type { ProjectFormFields } from '$lib/project-form';
	import type { Project } from '$lib/types';

	let {
		project = null,
		form = null
	}: {
		project?: Project | null;
		form?: { error?: string; fields?: ProjectFormFields } | null;
	} = $props();

	const value = (key: keyof ProjectFormFields, fallback: string) => form?.fields?.[key] ?? fallback;

	const inputClass =
		'mt-1.5 w-full rounded-lg border border-white/10 bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none';
</script>

{#if form?.error}
	<p class="rounded-lg bg-red-400/10 px-3 py-2 text-sm font-bold text-red-400">{form.error}</p>
{/if}

<form method="POST" class="mt-6 max-w-2xl space-y-5">
	<label class="block">
		<span class="text-xs font-bold text-muted">Title</span>
		<input
			type="text"
			name="title"
			required
			value={value('title', project?.title ?? '')}
			class={inputClass}
		/>
	</label>

	<label class="block">
		<span class="text-xs font-bold text-muted">Description</span>
		<textarea name="description" required rows="4" class={inputClass}
			>{value('description', project?.description ?? '')}</textarea
		>
	</label>

	<label class="block">
		<span class="text-xs font-bold text-muted">Tags (comma separated)</span>
		<input
			type="text"
			name="tags"
			placeholder="Svelte, TypeScript, Supabase"
			value={value('tags', project ? project.tags.join(', ') : '')}
			class={inputClass}
		/>
	</label>

	<div class="grid gap-5 md:grid-cols-2">
		<label class="block">
			<span class="text-xs font-bold text-muted">Demo URL</span>
			<input
				type="url"
				name="demo_url"
				placeholder="https://..."
				value={value('demo_url', project?.demo_url ?? '')}
				class={inputClass}
			/>
		</label>

		<label class="block">
			<span class="text-xs font-bold text-muted">GitHub URL</span>
			<input
				type="url"
				name="github_url"
				placeholder="https://github.com/..."
				value={value('github_url', project?.github_url ?? '')}
				class={inputClass}
			/>
		</label>
	</div>

	<label class="block">
		<span class="text-xs font-bold text-muted">Cover Image URL / Path</span>
		<input
			type="text"
			name="cover_url"
			placeholder="/ProjectPictures/BeenHereBefore.png or https://..."
			value={value('cover_url', project?.cover_url ?? '')}
			class={inputClass}
		/>
	</label>

	{#if project?.cover_url || value('cover_url', '')}
		<img
			src={value('cover_url', project?.cover_url ?? '')}
			alt="Cover preview"
			class="aspect-video w-full max-w-sm rounded-lg border border-white/5 object-cover"
		/>
	{/if}

	<button
		type="submit"
		class="cursor-pointer rounded-full bg-accent px-7 py-2.5 text-sm font-extrabold text-bg transition-opacity hover:opacity-90"
	>
		{project ? 'Save Changes' : 'Create Project'}
	</button>
</form>
