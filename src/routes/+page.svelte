<script lang="ts">
	import { MapPin } from '@lucide/svelte';
	import { gameDevMode, handleDuckClick } from '$lib/game-mode.svelte';
	import duckWhite from '$lib/assets/duck_white.png';
	import duckYellow from '$lib/assets/duck_yellow.png';
	import spotlight from '$lib/assets/Spotlight.svg';

	let quacks = $state<Array<{ id: number; x: number }>>([]);
	let nextQuackId = 0;

	function onDuckClick() {
		handleDuckClick();
		const id = nextQuackId++;
		const x = Math.floor(Math.random() * 25) - 12;
		quacks = [...quacks, { id, x }];
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

<section
	class="relative flex items-center justify-center overflow-hidden px-12 pb-6 md:px-20 md:pb-8 lg:px-24"
>
	<div class="flex items-center gap-2 sm:gap-8 md:gap-16">
		<div class="max-w-2xl">
			<h1 class="text-4xl leading-tight font-extrabold md:text-5xl">
				Hi, I am <span class="text-accent">Lloyd</span>,<br />
				<span class="text-accent">{gameDevMode.active ? 'Game' : 'Software'}</span> Developer
			</h1>

			<p class="mt-7 flex items-center gap-2 text-sm font-extrabold tracking-[0.2em]">
				<MapPin class="size-4.5 shrink-0 text-accent" />
				Bulacan, Philippines
			</p>

			<a
				href="/Resume.pdf"
				rel="external"
				download="Lloyd_Nicolas_Resume.pdf"
				class="mt-9 inline-block cursor-pointer rounded-full border border-accent-tr px-7 py-2.5 text-sm font-extrabold text-accent transition-colors hover:bg-accent/10"
			>
				Download CV / Resume
			</a>
		</div>

		<div class="relative w-28 shrink-0 aspect-[141/762] -translate-y-48 sm:w-32 sm:-translate-y-56 md:w-36 md:-translate-y-60">
			<img
				src={spotlight}
				alt=""
				class="pointer-events-none size-full select-none"
			/>

			<button
				type="button"
				onclick={onDuckClick}
				aria-label={gameDevMode.active
					? 'Revert to Software Developer mode'
					: 'A pixel duck standing in the spotlight'}
				class="absolute bottom-[2.5%] left-1/2 origin-bottom -translate-x-1/2 cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-[1.3]"
			>
				<img
					src={gameDevMode.active ? duckYellow : duckWhite}
					alt=""
					class="w-14 sm:w-16 md:w-18 pixelated"
				/>
			</button>

			{#each quacks as quack (quack.id)}
				<span
					class="quack-anim pointer-events-none absolute bottom-[2%] left-1/2 select-none text-xs font-extrabold text-accent font-pixel"
					style="margin-left: {quack.x}px;"
				>
					Quack!
				</span>
			{/each}
		</div>
	</div>
</section>

<style>
	@keyframes quackDown {
		0% {
			opacity: 1;
			transform: translate(-50%, 0) scale(1.1);
		}
		50% {
			opacity: 0.8;
		}
		100% {
			opacity: 0;
			transform: translate(-50%, 26px) scale(0.85);
		}
	}

	.quack-anim {
		animation: quackDown 0.8s cubic-bezier(0.2, 0.8, 0.4, 1) forwards;
	}
</style>

<section id="about" class="px-8 pt-4 pb-20 md:px-12 md:pt-6 md:pb-28">
	<div class="mx-auto w-full max-w-2xl">
		<h2 class="text-3xl font-extrabold md:text-4xl">About</h2>

		<div class="mt-8 space-y-5 text-base leading-relaxed text-muted md:text-lg">
			<p>
				Hi, I'm Lloyd — a {gameDevMode.active ? 'game' : 'software'} developer from Bulacan,
				Philippines. I enjoy building clean, modern web applications and turning ideas into products
				people can actually use.
			</p>
			<p>
				When I'm not shipping web apps, I'm exploring game development — prototyping mechanics,
				playtesting with friends, and chasing that perfect game feel. (Psst… try clicking the duck
				on the home page.)
			</p>
			<p>
				I care about thoughtful UI, pixel-perfect details, and code that stays simple. Currently
				open to collaborations, freelance work, and game jams.
			</p>
		</div>

		<h3 class="mt-12 text-xl font-extrabold md:text-2xl">Skills</h3>
		<ul class="mt-4 flex flex-wrap gap-2.5">
			{#each ['TypeScript', 'Svelte / SvelteKit', 'Node.js', 'Supabase', 'Tailwind CSS', 'PostgreSQL', 'Git', 'Game Development'] as skill (skill)}
				<li class="rounded-full bg-accent/10 px-3.5 py-1.5 text-sm font-bold text-accent">
					{skill}
				</li>
			{/each}
		</ul>
	</div>
</section>
