<script lang="ts">
	import { MapPin } from '@lucide/svelte';
	import { base } from '$app/paths';
	import { gameDevMode, handleDuckClick } from '$lib/game-mode.svelte';
	import duckWhite from '$lib/assets/duck_white.png';
	import duckYellow from '$lib/assets/duck_yellow.png';
	import spotlight from '$lib/assets/Spotlight.svg';
	import GithubActivity from '$lib/components/GithubActivity.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let quacks = $state<Array<{ id: number; x: number; rot: number }>>([]);
	let nextQuackId = 0;

	function onDuckClick() {
		handleDuckClick();
		const id = nextQuackId++;
		const x = Math.floor(Math.random() * 26) - 13;
		const rot = Math.floor(Math.random() * 16) - 8;
		quacks = [...quacks, { id, x, rot }];
		setTimeout(() => {
			quacks = quacks.filter((q) => q.id !== id);
		}, 800);
	}
</script>

<svelte:head>
	<title>
		{gameDevMode.active ? 'Game' : 'Software'} Developer — Lloyd Nicolas
	</title>
</svelte:head>

<section class="relative overflow-hidden px-8 pb-6 md:px-12 md:pb-8">
	<div class="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 sm:gap-8 md:gap-12">
		<div class="max-w-xl flex-1">
			<h1 class="anim-fade-in-up text-4xl leading-tight font-extrabold md:text-5xl">
				Hi, I am <span class="text-accent">Lloyd</span>,<br />
				<span class="text-accent">{gameDevMode.active ? 'Game' : 'Software'}</span> Developer
			</h1>

			<p
				class="anim-fade-in-up mt-7 flex items-center gap-2 text-sm font-extrabold tracking-[0.2em]"
				style="animation-delay: 100ms;"
			>
				<MapPin class="size-4.5 shrink-0 text-accent" />
				Bulacan, Philippines
			</p>

			<a
				href="{base}/Resume.pdf"
				rel="external"
				download="Lloyd_Nicolas_Resume.pdf"
				class="anim-fade-in-up border-accent-tr mt-9 inline-block cursor-pointer rounded-full border px-7 py-2.5 text-sm font-extrabold text-accent transition-all duration-200 hover:scale-105 hover:bg-accent/15 active:scale-95"
				style="animation-delay: 200ms;"
			>
				Download CV / Resume
			</a>
		</div>

		<div
			class="anim-spotlight relative aspect-[141/762] w-28 shrink-0 -translate-y-48 sm:w-32 sm:-translate-y-56 md:w-36 md:-translate-y-60"
		>
			<img src={spotlight} alt="" class="pointer-events-none size-full select-none" />

			<button
				type="button"
				onclick={onDuckClick}
				aria-label={gameDevMode.active
					? 'Revert to Software Developer mode'
					: 'A pixel duck standing in the spotlight'}
				class="anim-duck-idle absolute bottom-[2.5%] left-1/2 origin-bottom -translate-x-1/2 cursor-pointer transition-transform duration-200 hover:scale-115 active:scale-[1.35]"
			>
				<img
					src={gameDevMode.active ? duckYellow : duckWhite}
					alt=""
					class="w-14 pixelated sm:w-16 md:w-18"
				/>
			</button>

			{#each quacks as quack (quack.id)}
				<span
					class="quack-anim pointer-events-none absolute bottom-[2%] left-1/2 font-pixel text-xs font-extrabold text-accent select-none"
					style="margin-left: {quack.x}px; --rot: {quack.rot}deg;"
				>
					Quack!
				</span>
			{/each}
		</div>
	</div>
</section>

<!-- GitHub Contribution Activity Heatmap -->
<GithubActivity contributions={data.contributions} />

<section id="about" class="px-8 pt-4 pb-20 md:px-12 md:pt-6 md:pb-28">
	<div class="mx-auto w-full max-w-3xl">
		<h2 class="anim-fade-in-up text-3xl font-extrabold md:text-4xl">About</h2>

		<div class="mt-8 space-y-5 text-base leading-relaxed text-muted md:text-lg">
			<p class="anim-fade-in-up" style="animation-delay: 80ms;">
				Hi, I'm Lloyd — a {gameDevMode.active ? 'game' : 'software'} developer from Bulacan, Philippines.
				I enjoy building clean, modern web applications and turning ideas into products people can actually
				use.
			</p>
			<p class="anim-fade-in-up" style="animation-delay: 140ms;">
				When I'm not shipping web apps, I'm exploring game development — prototyping mechanics,
				playtesting with friends, and chasing that perfect game feel. (Psst… try clicking the duck
				on the home page.)
			</p>
			<p class="anim-fade-in-up" style="animation-delay: 200ms;">
				I care about thoughtful UI, pixel-perfect details, and code that stays simple. Currently
				open to collaborations, freelance work, and game jams.
			</p>
		</div>

		<h3
			class="anim-fade-in-up mt-12 text-xl font-extrabold md:text-2xl"
			style="animation-delay: 240ms;"
		>
			Skills
		</h3>
		<ul class="mt-4 flex flex-wrap gap-2.5">
			{#each ['TypeScript', 'Svelte / SvelteKit', 'Node.js', 'Tailwind CSS', 'PostgreSQL', 'Git', 'Game Development'] as skill, i (skill)}
				<li
					class="anim-fade-in-up cursor-default rounded-full border border-transparent bg-accent/10 px-3.5 py-1.5 text-sm font-bold text-accent transition-all duration-200 hover:-translate-y-0.5 hover:scale-110 hover:border-accent/40 hover:bg-accent/20 hover:shadow-md hover:shadow-accent/25"
					style="animation-delay: {280 + i * 50}ms;"
				>
					{skill}
				</li>
			{/each}
		</ul>
	</div>
</section>

<style>
	@keyframes quackDown {
		0% {
			opacity: 1;
			transform: translate(-50%, 0) rotate(var(--rot, 0deg)) scale(1.15);
		}
		50% {
			opacity: 0.9;
		}
		100% {
			opacity: 0;
			transform: translate(-50%, 28px) rotate(var(--rot, 0deg)) scale(0.85);
		}
	}

	.quack-anim {
		animation: quackDown 0.8s cubic-bezier(0.2, 0.8, 0.4, 1) forwards;
	}
</style>
