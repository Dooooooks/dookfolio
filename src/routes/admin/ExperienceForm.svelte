<script lang="ts">
	import type { ExperienceFormFields } from '$lib/experience-form';
	import type { Experience } from '$lib/types';

	let {
		experience = null,
		form = null
	}: {
		experience?: Experience | null;
		form?: { error?: string; fields?: ExperienceFormFields } | null;
	} = $props();

	const value = (key: keyof ExperienceFormFields, fallback: string) =>
		form?.fields?.[key] ?? fallback;

	const inputClass =
		'mt-1.5 w-full rounded-lg border border-white/10 bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none';
</script>

{#if form?.error}
	<p class="rounded-lg bg-red-400/10 px-3 py-2 text-sm font-bold text-red-400">{form.error}</p>
{/if}

<form method="POST" class="mt-6 max-w-2xl space-y-5">
	<div class="grid gap-5 md:grid-cols-2">
		<label class="block">
			<span class="text-xs font-bold text-muted">Role / Title</span>
			<input
				type="text"
				name="role"
				placeholder="Software Developer"
				required
				value={value('role', experience?.role ?? '')}
				class={inputClass}
			/>
		</label>

		<label class="block">
			<span class="text-xs font-bold text-muted">Company / Organization</span>
			<input
				type="text"
				name="company"
				placeholder="Freelance"
				required
				value={value('company', experience?.company ?? '')}
				class={inputClass}
			/>
		</label>
	</div>

	<div class="grid gap-5 md:grid-cols-2">
		<label class="block">
			<span class="text-xs font-bold text-muted">Period</span>
			<input
				type="text"
				name="period"
				placeholder="2023 — PRESENT"
				required
				value={value('period', experience?.period ?? '')}
				class={inputClass}
			/>
		</label>

		<label class="block">
			<span class="text-xs font-bold text-muted">Order (lower comes first)</span>
			<input
				type="number"
				name="order_num"
				value={value('order_num', String(experience?.order_num ?? 0))}
				class={inputClass}
			/>
		</label>
	</div>

	<label class="block">
		<span class="text-xs font-bold text-muted">Description</span>
		<textarea name="description" required rows="4" class={inputClass}
			>{value('description', experience?.description ?? '')}</textarea
		>
	</label>

	<button
		type="submit"
		class="cursor-pointer rounded-full bg-accent px-7 py-2.5 text-sm font-extrabold text-bg transition-opacity hover:opacity-90"
	>
		{experience ? 'Save Changes' : 'Create Experience'}
	</button>
</form>
