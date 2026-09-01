<script lang="ts">
	import { ArrowLeft } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Experiences — Lloyd Nicolas</title>
</svelte:head>

<section class="relative flex min-h-screen flex-col px-8 py-16 pb-[40vh] md:px-12">
	<a
		href={resolve('/')}
		class="absolute top-8 left-8 md:top-10 md:left-12 inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-white"
	>
		<ArrowLeft class="size-4" />
		Back to Home
	</a>

	<div class="mx-auto my-auto w-full max-w-2xl">
		<h1 class="text-3xl font-extrabold">Experiences</h1>

		<ol class="mt-10 space-y-10 border-l border-white/10 pl-6">
			{#each data.experiences as exp (exp.id)}
				<li class="relative">
					<span class="absolute top-1.5 -left-[30.5px] size-2.5 rounded-full bg-accent"></span>
					<p class="text-xs font-bold tracking-widest text-muted">{exp.period}</p>
					<h2 class="mt-1 text-lg font-extrabold">{exp.role}</h2>
					<p class="text-sm font-bold text-accent">{exp.company}</p>
					<p class="mt-2 text-sm leading-relaxed text-muted">
						{exp.description}
					</p>
				</li>
			{/each}
		</ol>
	</div>
</section>
