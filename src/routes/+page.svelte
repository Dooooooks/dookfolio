<script lang="ts">
	import { onMount } from 'svelte';
	import { MapPin } from '@lucide/svelte';
	import { base } from '$app/paths';
	import {
		gameDevMode,
		calculateDuckClick,
		feedDuck,
		upgrades,
		combo,
		goldenBoost,
		decayCombo
	} from '$lib/game-mode.svelte';
	import duckWhite from '$lib/assets/duck_white.png';
	import duckYellow from '$lib/assets/duck_yellow.png';
	import spotlight from '$lib/assets/Spotlight.svg';
	import GithubActivity from '$lib/components/GithubActivity.svelte';
	import FlyingBreadcrumbs from '$lib/components/FlyingBreadcrumbs.svelte';
	import GoldenBreadcrumb from '$lib/components/GoldenBreadcrumb.svelte';
	import SkillsSection from '$lib/components/SkillsSection.svelte';
	import HomeProjectsFan from '$lib/components/HomeProjectsFan.svelte';
	import HomeBlogsSection from '$lib/components/HomeBlogsSection.svelte';
	import { synth } from '$lib/synth.svelte';
	import { reveal } from '$lib/actions/reveal';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let quacks = $state<
		Array<{ id: number; x: number; rot: number; text: string; isCrit?: boolean; isBurst?: boolean }>
	>([]);
	let nextQuackId = 0;
	let duckButtonEl = $state<HTMLElement | null>(null);
	let isChomping = $state(false);

	// Scale progression: fed 0 -> 1.0, fed 1 -> 1.1, fed 2 -> 1.2, fed 3 -> 1.3, fed 4 -> 1.4, fed 5 -> 1.5
	const duckScale = $derived(
		gameDevMode.fedCount === 0
			? 1
			: gameDevMode.fedCount === 1
				? 1.1
				: gameDevMode.fedCount === 2
					? 1.2
					: gameDevMode.fedCount === 3
						? 1.3
						: gameDevMode.fedCount === 4
							? 1.4
							: 1.5
	);

	const warningText = $derived(
		gameDevMode.active || gameDevMode.fedCount >= 5
			? 'Congratulation, the duck officially married you'
			: gameDevMode.fedCount === 4
				? 'THIS IS YOUR FINAL WARNING'
				: gameDevMode.fedCount === 3
					? "I'M WARNING YOU."
					: gameDevMode.fedCount === 2
						? 'SERIOUSLY, STOP FEEDING HIM'
						: gameDevMode.fedCount === 1
							? 'Stop'
							: "DON'T FEED THE DUCK"
	);

	function onDuckClick() {
		const { earned, isCrit } = calculateDuckClick();
		synth.playQuack(isCrit);
		const id = nextQuackId++;
		const x = Math.floor(Math.random() * 26) - 13;
		const rot = Math.floor(Math.random() * 16) - 8;
		const text = isCrit
			? `CRIT! +${earned} Quacks! 🔥`
			: `+${earned} ${earned === 1 ? 'Quack' : 'Quacks'}! ✨`;
		quacks = [...quacks, { id, x, rot, text, isCrit }];
		setTimeout(() => {
			quacks = quacks.filter((q) => q.id !== id);
		}, 850);
	}

	function onCrumbFed() {
		const newCount = feedDuck();
		synth.playFeed();
		isChomping = true;
		setTimeout(() => {
			isChomping = false;
		}, 450);

		const id = nextQuackId++;
		const x = Math.floor(Math.random() * 26) - 13;
		const rot = Math.floor(Math.random() * 16) - 8;
		const text =
			newCount === 1
				? 'Nom! (+1 Stronger Quack)'
				: newCount === 2
					? 'Chomp! (+1 Stronger Quack)'
					: newCount === 3
						? 'Gulp! (+1 Stronger Quack)'
						: newCount === 4
							? 'BURP! (+1 Stronger Quack)'
							: 'QUACK!! ✨ (+1 Stronger Quack)';
		quacks = [...quacks, { id, x, rot, text }];
		setTimeout(() => {
			quacks = quacks.filter((q) => q.id !== id);
		}, 900);
	}

	function onGoldenReward(message: string, isBurst = false) {
		const id = nextQuackId++;
		const x = Math.floor(Math.random() * 20) - 10;
		const rot = Math.floor(Math.random() * 12) - 6;
		quacks = [...quacks, { id, x, rot, text: message, isCrit: !isBurst, isBurst }];
		setTimeout(() => {
			quacks = quacks.filter((q) => q.id !== id);
		}, 1400);
	}

	onMount(() => {
		const comboInterval = setInterval(() => {
			decayCombo(3.5);
		}, 100);
		return () => {
			clearInterval(comboInterval);
		};
	});
</script>

<svelte:head>
	<title>
		{gameDevMode.active ? 'Game' : 'Software'} Developer — Lloyd Nicolas
	</title>
</svelte:head>

<!-- Main Hero Section with Flying Breadcrumbs -->
<section class="relative overflow-hidden px-8 pb-6 md:px-12 md:pb-8">
	<!-- Flying Breadcrumbs Overlay (Purple/Lavender Palette - Zero Yellow) -->
	<FlyingBreadcrumbs onFeed={onCrumbFed} duckElement={duckButtonEl} />

	<!-- Golden Breadcrumbs (Rare floating drops with bursts & 3x boosts, 0 effect on game dev mode) -->
	<GoldenBreadcrumb {onGoldenReward} />

	<div class="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 sm:gap-8 md:gap-12">
		<div class="max-w-xl flex-1">
			<h1 class="anim-fade-in-up text-3xl sm:text-4xl md:text-5xl leading-tight font-extrabold">
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
			class="anim-spotlight relative aspect-[141/762] w-24 shrink-0 -translate-y-48 sm:w-32 sm:-translate-y-56 md:w-36 md:-translate-y-60"
		>
			<img src={spotlight} alt="" class="pointer-events-none size-full select-none" />

			<!-- Duck Container with Dynamic Scale Progression -->
			<div
				class="absolute bottom-[1.7%] left-1/2 origin-bottom transition-transform duration-300 ease-out"
				style="transform: translateX(-50%) scale({duckScale});"
			>
				{#each quacks as quack (quack.id)}
					<span
						class="quack-anim pointer-events-none absolute bottom-full left-1/2 mb-1 whitespace-nowrap font-pixel select-none {quack.isBurst
							? 'text-sm font-black text-[#ff9494] drop-shadow-[0_0_12px_rgba(255,148,148,0.9)] scale-110'
							: quack.isCrit
								? 'text-sm font-black text-[#ffe794] drop-shadow-[0_0_12px_rgba(255,231,148,0.9)] scale-110'
								: 'text-xs font-extrabold text-accent drop-shadow-[0_0_8px_rgba(182,148,255,0.6)]'}"
						style="margin-left: {quack.x}px; --rot: {quack.rot}deg;"
					>
						{quack.text}
					</span>
				{/each}

				<button
					id="hero-duck-button"
					bind:this={duckButtonEl}
					type="button"
					onclick={onDuckClick}
					aria-label="A pixel duck standing in the spotlight (Click to quack)"
					class="anim-duck-idle cursor-pointer touch-manipulation transition-transform duration-200 hover:scale-110 active:scale-125 {isChomping
						? 'anim-duck-chomp'
						: ''}"
				>
					<img
						src={gameDevMode.active ? duckYellow : duckWhite}
						alt=""
						class="w-14 pixelated sm:w-16 md:w-18"
					/>
				</button>

				<!-- Simple Frenzy & Lucky Breadcrumb Buff UI (Below Duck) -->
				{#if (upgrades.quackCombo > 0 && combo.meter > 0) || goldenBoost.active}
					<div
						class="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1.5 flex flex-col items-center gap-1 whitespace-nowrap z-20"
					>
						<!-- Breadcrumb Buff UI (In Line with #ffe794) -->
						{#if goldenBoost.active}
							<div
								class="flex items-center gap-1 rounded-full border border-[#ffe794]/40 bg-[#ffe794]/15 px-2 py-0.5 font-pixel text-[8px] font-bold text-[#ffe794] tracking-wider uppercase backdrop-blur-xs shadow-xs shadow-[#ffe794]/20"
							>
								<span>✨ {goldenBoost.multiplier.toFixed(1)}x Rush ({goldenBoost.remainingSeconds}s)</span>
							</div>
						{/if}

						<!-- Frenzy Meter -->
						{#if upgrades.quackCombo > 0 && combo.meter > 0}
							<div class="flex flex-col items-center gap-0.5">
								<!-- Minimal thin progress bar -->
								<div class="h-1 w-12 sm:w-14 overflow-hidden rounded-full bg-white/15">
									<div
										class="h-full rounded-full transition-all duration-100 {combo.meter >= 80
											? 'bg-[#ffe794] shadow-xs shadow-[#ffe794]/60'
											: 'bg-accent/80'}"
										style="width: {combo.meter}%;"
									></div>
								</div>
								<span
									class="font-pixel text-[8px] tracking-wider uppercase {combo.meter >= 80
										? 'font-extrabold text-[#ffe794] drop-shadow-[0_0_6px_rgba(255,231,148,0.5)]'
										: 'text-muted'}"
								>
									{#if combo.meter >= 80}
										Frenzy x{combo.multiplier.toFixed(1)} {upgrades.quackCombo >= 5 ? '★' : ''}
									{:else if combo.meter >= 30}
										Combo x{combo.multiplier.toFixed(1)}
									{:else}
										Combo
									{/if}
								</span>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
</section>

<!-- Easter Egg Warning Notice: Don't feed the duck -->
<div
	use:reveal={{ delay: 50, y: 16 }}
	class="-mt-2 mb-10 flex flex-col items-center justify-center px-8 select-none"
>
	<div class="flex items-center gap-2.5 transition-all duration-300">
		<p
			class="font-pixel text-xs tracking-widest transition-colors duration-300 sm:text-sm {gameDevMode.active ||
			gameDevMode.fedCount >= 5
				? 'font-extrabold text-accent drop-shadow-[0_0_12px_rgba(182,148,255,0.7)]'
				: gameDevMode.fedCount === 4
					? 'font-extrabold text-[#ff9494] drop-shadow-[0_0_10px_rgba(255,148,148,0.55)]'
					: gameDevMode.fedCount === 3
						? 'font-bold text-[#ffb194] drop-shadow-[0_0_8px_rgba(255,177,148,0.45)]'
						: gameDevMode.fedCount === 2
							? 'font-bold text-[#ffe794] drop-shadow-[0_0_8px_rgba(255,231,148,0.4)]'
							: gameDevMode.fedCount === 1
								? 'font-bold text-purple-300 drop-shadow-[0_0_8px_rgba(182,148,255,0.35)]'
								: 'font-medium text-accent/80'}"
		>
			{warningText}
		</p>
	</div>
	<div
		class="mt-1.5 h-0.5 rounded-full transition-all duration-500 {gameDevMode.active ||
		gameDevMode.fedCount >= 5
			? 'w-72 bg-accent/50 shadow-[0_0_10px_rgba(182,148,255,0.5)]'
			: gameDevMode.fedCount === 4
				? 'w-60 bg-[#ff9494]/50'
				: gameDevMode.fedCount === 3
					? 'w-48 bg-[#ffb194]/45'
					: gameDevMode.fedCount === 2
						? 'w-40 bg-[#ffe794]/40'
						: gameDevMode.fedCount === 1
							? 'w-32 bg-purple-400/35'
							: 'w-24 bg-accent/25'}"
	></div>
</div>

<!-- GitHub Contribution Activity Heatmap -->
<GithubActivity contributions={data.contributions} />

<section id="about" class="px-8 pt-4 pb-20 md:px-12 md:pt-6 md:pb-28">
	<div class="mx-auto w-full max-w-3xl">
		<h2 use:reveal={{ y: 22 }} class="text-3xl font-extrabold md:text-4xl">About</h2>

		<div class="mt-8 space-y-5 text-base leading-relaxed text-muted text-justify md:text-lg">
			<p use:reveal={{ delay: 70, y: 20 }} class="text-justify">
				Hi, I'm Lloyd — a {gameDevMode.active ? 'game' : 'software'} developer from Bulacan, Philippines.
				I enjoy building clean, modern web applications and turning ideas into products people can actually
				use.
			</p>
			<p use:reveal={{ delay: 140, y: 20 }} class="text-justify">
				When I'm not shipping web apps, I'm exploring game development — prototyping mechanics,
				playtesting with friends, and chasing that perfect game feel. (Psst… whatever you do, don't
				feed the duck on the home page.)
			</p>
			<p use:reveal={{ delay: 210, y: 20 }} class="text-justify">
				I care about thoughtful UI, pixel-perfect details, and code that stays simple. Currently
				open to collaborations, freelance work, and game jams.
			</p>
		</div>

		<SkillsSection />

		<!-- Featured Projects Section (Fan-Shaped Cards) -->
		<HomeProjectsFan />

		<!-- Blogs Section (Latest 5 Blogs) -->
		<HomeBlogsSection />
	</div>
</section>

<style>
	@keyframes quackUp {
		0% {
			opacity: 1;
			transform: translate(-50%, 0) rotate(var(--rot, 0deg)) scale(1.15);
		}
		50% {
			opacity: 0.9;
		}
		100% {
			opacity: 0;
			transform: translate(-50%, -28px) rotate(var(--rot, 0deg)) scale(0.85);
		}
	}

	.quack-anim {
		animation: quackUp 0.8s cubic-bezier(0.2, 0.8, 0.4, 1) forwards;
	}
</style>
