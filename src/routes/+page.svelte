<script lang="ts">
	import { MapPin } from '@lucide/svelte';
	import { gameDevMode, handleDuckClick } from '$lib/game-mode.svelte';
	import duckWhite from '$lib/assets/duck_white.png';
	import duckYellow from '$lib/assets/duck_yellow.png';
	import spotlight from '$lib/assets/Spotlight.svg';
	import clickMe from '$lib/assets/click_me.png';
</script>

<section
	class="relative flex min-h-screen items-center justify-center overflow-hidden px-8 pb-[40vh] md:px-16 lg:px-24"
>
	<div class="flex items-center gap-16 md:gap-24">
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
				class="mt-9 inline-block cursor-pointer rounded-full border border-accent px-7 py-2.5 text-sm font-extrabold text-accent transition-colors hover:bg-accent/10"
			>
				Download CV / Resume
			</a>
		</div>

		<div class="relative h-[28vh] w-32 shrink-0">
			<img
				src={spotlight}
				alt=""
				class="pointer-events-none absolute bottom-7 left-1/2 w-auto -translate-x-1/2"
			/>

			<button
				type="button"
				onclick={handleDuckClick}
				aria-label={gameDevMode.active
					? 'Revert to Software Developer mode'
					: 'A pixel duck standing in the spotlight'}
				class="absolute bottom-[3.5vh] left-1/2 origin-bottom -translate-x-1/2 cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-[1.3]"
			>
				<img src={gameDevMode.active ? duckYellow : duckWhite} alt="" class="size-18 pixelated" />
			</button>

			<img
				src={clickMe}
				alt="Click Me"
				class="pointer-events-none absolute bottom-[calc(3.5vh+1.25rem)] left-[5.25rem] w-20"
			/>
		</div>
	</div>
</section>
