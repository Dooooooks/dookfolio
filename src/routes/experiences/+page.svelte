<script lang="ts">
	import { ArrowLeft, Calendar, Building2 } from '@lucide/svelte';
	import { resolve } from '$app/paths';
	import { reveal } from '$lib/actions/reveal';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Experiences — Lloyd Nicolas</title>
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
			<h1 class="text-3xl font-extrabold md:text-4xl">Experiences</h1>
			<p class="mt-2 text-sm text-muted md:text-base">
				My career path, milestones, and development journey.
			</p>
		</div>

		<ol class="mt-10 space-y-8 border-l-2 border-accent/20 pl-6 md:pl-8">
			{#each data.experiences as exp, i (exp.company)}
				<li
					use:reveal={{ delay: 100 + i * 110, y: 24, scale: 0.96 }}
					class="group relative rounded-xl border border-transparent p-4 transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:bg-surface/50"
				>
					<!-- Glowing timeline node -->
					<span
						class="absolute top-5 -left-[31px] flex size-3 items-center justify-center rounded-full bg-accent ring-4 ring-accent/20 transition-all duration-300 group-hover:scale-125 group-hover:ring-accent/40 md:-left-[39px]"
					></span>

					<div class="flex flex-wrap items-center gap-3 text-xs font-bold text-muted">
						<span class="inline-flex items-center gap-1 text-accent">
							<Calendar class="size-3.5" />
							{exp.period}
						</span>
						<span class="text-white/20">•</span>
						<span class="inline-flex items-center gap-1">
							<Building2 class="size-3.5" />
							{exp.company}
						</span>
					</div>

					<h2
						class="mt-2 text-lg font-extrabold text-white transition-colors group-hover:text-accent md:text-xl"
					>
						{exp.role}
					</h2>

					<p class="mt-2.5 text-sm leading-relaxed text-muted text-justify">
						{exp.description}
					</p>
				</li>
			{/each}
		</ol>
	</div>
</section>
