<script lang="ts">
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>Admin Login — Lloyd Nicolas</title>
</svelte:head>

<section class="flex min-h-screen items-center justify-center px-8 pb-[40vh]">
	<div class="w-full max-w-sm rounded-xl border border-white/5 bg-surface p-8">
		<h1 class="text-2xl font-extrabold">Admin Login</h1>
		<p class="mt-1 text-sm text-muted">Sign in to manage your projects.</p>

		{#if form?.error}
			<p class="mt-4 rounded-lg bg-red-400/10 px-3 py-2 text-sm font-bold text-red-400">
				{form.error}
			</p>
		{/if}

		<form method="POST" class="mt-6 space-y-4">
			<label class="block">
				<span class="text-xs font-bold text-muted">Email</span>
				<input
					type="email"
					name="email"
					required
					value={form?.email ?? ''}
					class="mt-1.5 w-full rounded-lg border border-white/10 bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
				/>
			</label>

			<label class="block">
				<span class="text-xs font-bold text-muted">Password</span>
				<input
					type="password"
					name="password"
					required
					class="mt-1.5 w-full rounded-lg border border-white/10 bg-bg px-3 py-2 text-sm focus:border-accent focus:outline-none"
				/>
			</label>

			<button
				type="submit"
				class="w-full cursor-pointer rounded-full bg-accent px-6 py-2.5 text-sm font-extrabold text-bg transition-opacity hover:opacity-90"
			>
				Sign In
			</button>
		</form>
	</div>
</section>
