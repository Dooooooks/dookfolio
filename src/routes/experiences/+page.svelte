<script lang="ts">
	import { ArrowLeft, Calendar, Building2 } from '@lucide/svelte';
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
		class="group absolute top-8 left-8 inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-white md:top-10 md:left-12"
	>
		<ArrowLeft class="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
		Back to Home
	</a>

	<div class="mx-auto my-auto w-full max-w-2xl pt-8 sm:pt-0">
		<div class="anim-fade-in-up">
			<h1 class="text-3xl font-extrabold md:text-4xl">Experiences</h1>
			<p class="mt-2 text-sm text-muted md:text-base">
				My career path, milestones, and development journey.
			</p>
		</div>

		<ol class="mt-10 space-y-8 border-l-2 border-accent/20 pl-6 md:pl-8">
			{#each data.experiences as exp, i (exp.id)}
				<li
					class="anim-fade-in-up group relative rounded-xl border border-transparent p-4 transition-all duration-300 hover:-translate-y-1 hover:border-white/10 hover:bg-surface/50"
					style="animation-delay: {100 + i * 120}ms;"
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

					<p class="mt-2.5 text-sm leading-relaxed text-muted">
						{exp.description}
					</p>
				</li>
			{/each}
		</ol>
	</div>
</section>
