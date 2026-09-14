<script lang="ts">
	import { onMount } from 'svelte';
	import '@fontsource-variable/nunito';
	import '@fontsource-variable/pixelify-sans';
	import './layout.css';
	import duckWhite from '$lib/assets/duck_white.png';
	import duckYellow from '$lib/assets/duck_yellow.png';
	import profile from '$lib/assets/profile.png';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import {
		Briefcase,
		ChevronLeft,
		ChevronRight,
		House,
		Mail,
		Newspaper,
		User
	} from '@lucide/svelte';
	import { gameDevMode } from '$lib/game-mode.svelte';
	import AbstractTriangleFlanks from '$lib/components/AbstractTriangleFlanks.svelte';

	let { children } = $props();

	let isOpen = $state(true);

	onMount(() => {
		if (window.innerWidth < 768) {
			isOpen = false;
		}
	});

	const links = [
		{ href: '/', label: 'Home', icon: House },
		{ href: '/#about', label: 'About', icon: User },
		{ href: '/projects', label: 'Projects', icon: Newspaper },
		{ href: '/experiences', label: 'Experiences', icon: Briefcase },
		{ href: '/contacts', label: 'Contacts', icon: Mail }
	] as const;
</script>

<svelte:head>
	<link rel="icon" type="image/png" href={gameDevMode.active ? duckYellow : duckWhite} />
</svelte:head>

<div class="min-h-screen bg-bg {gameDevMode.active ? 'font-pixel' : 'font-sans'}">
	<!-- Floating Open Button with background when Sidebar is closed -->
	{#if !isOpen}
		<button
			type="button"
			onclick={() => (isOpen = true)}
			aria-label="Open sidebar"
			class="fixed top-3.5 left-3 z-20 flex size-8 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-surface/90 text-muted shadow-lg backdrop-blur transition-all hover:border-white/20 hover:bg-surface hover:text-white"
		>
			<ChevronRight class="size-4.5" strokeWidth={1.75} />
		</button>
	{/if}

	<!-- Backdrop on Mobile -->
	{#if isOpen}
		<button
			type="button"
			onclick={() => (isOpen = false)}
			aria-label="Close sidebar backdrop"
			class="fixed inset-0 z-10 bg-black/50 backdrop-blur-xs md:hidden"
		></button>
	{/if}

	<!-- Sidebar -->
	<aside
		class="fixed inset-y-0 left-0 z-20 flex w-52 flex-col bg-surface px-4 py-6 shadow-xl transition-transform duration-300 ease-in-out {isOpen
			? 'translate-x-0'
			: '-translate-x-full'}"
	>
		<!-- Close Button at top-rightmost corner -->
		<button
			type="button"
			onclick={() => (isOpen = false)}
			aria-label="Close sidebar"
			class="absolute top-3.5 right-3 cursor-pointer rounded-lg p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-white"
		>
			<ChevronLeft class="size-4" strokeWidth={1.75} />
		</button>

		<div class="flex items-center gap-3 px-1 pt-1">
			<img src={profile} alt="Lloyd Nicolas" class="size-9 shrink-0 rounded-full object-cover" />
			<div>
				<p class="text-sm font-extrabold text-white">Lloyd Nicolas</p>
				<p class="text-xs font-bold text-accent">Developer</p>
			</div>
		</div>

		<nav class="mt-10 flex flex-col gap-1.5">
			{#each links as link (link.href)}
				{@const active =
					link.href === '/#about'
						? page.url.pathname === '/' && page.url.hash === '#about'
						: link.href === '/'
							? page.url.pathname === '/' && !page.url.hash
							: page.url.pathname === link.href}
				<a
					href={resolve(link.href)}
					aria-current={active ? 'page' : undefined}
					class="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold transition-all duration-150 {active
						? 'border-l-2 border-accent bg-accent/10 font-extrabold text-accent shadow-sm'
						: 'text-muted hover:translate-x-1 hover:bg-white/5 hover:text-white'}"
				>
					<link.icon
						class="size-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110 {active
							? 'text-accent'
							: 'text-muted group-hover:text-white'}"
					/>
					<span>{link.label}</span>
				</a>
			{/each}
		</nav>
	</aside>

	<!-- Animated Geometric Triangle Flanks (Dynamic Per Tab) -->
	<AbstractTriangleFlanks {isOpen} />

	<!-- Main Content Area -->
	<main
		class="relative z-10 min-h-screen transition-all duration-300 ease-in-out {isOpen
			? 'md:ml-52'
			: 'ml-0'}"
	>
		{#key page.url.pathname}
			<div class="anim-page-transition">
				{@render children()}
			</div>
		{/key}
	</main>
</div>
