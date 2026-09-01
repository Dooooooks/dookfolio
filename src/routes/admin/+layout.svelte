<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();
</script>

<div class="min-h-screen px-8 py-10 md:px-12">
	<header class="flex items-center justify-between">
		<a href={resolve('/')} class="text-sm font-bold text-muted hover:text-white">
			← Back to site
		</a>
		{#if data.email}
			<form method="POST" action="/admin?/logout" class="flex items-center gap-3">
				<span class="text-sm text-muted">{data.email}</span>
				<button
					type="submit"
					class="cursor-pointer rounded-full border border-white/10 px-4 py-1.5 text-xs font-bold text-muted transition-colors hover:border-red-400/40 hover:text-red-400"
				>
					Sign Out
				</button>
			</form>
		{/if}
	</header>

	<div class="mt-8">{@render children()}</div>
</div>
