<script lang="ts">
	import '@fontsource-variable/nunito';
	import '@fontsource-variable/pixelify-sans';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import profile from '$lib/assets/profile.png';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Briefcase, ChevronLeft, ChevronRight, House, Newspaper, User } from '@lucide/svelte';
	import { gameDevMode } from '$lib/game-mode.svelte';

	let { children } = $props();

	let isOpen = $state(true);

	const links = [
		{ href: '/', label: 'Home', icon: House },
		{ href: '/#about', label: 'About', icon: User },
		{ href: '/projects', label: 'Projects', icon: Newspaper },
		{ href: '/experiences', label: 'Experiences', icon: Briefcase }
	] as const;
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-bg {gameDevMode.active ? 'font-pixel' : 'font-sans'}">
	<!-- Minimal Floating Open Button when Sidebar is closed -->
	{#if !isOpen}
		<button
			type="button"
			onclick={() => (isOpen = true)}
			aria-label="Open sidebar"
			class="fixed top-3.5 left-3 z-20 flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-white"
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
					class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold transition-colors {active
						? 'bg-white/6 text-white'
						: 'text-muted hover:bg-white/4 hover:text-white'}"
				>
					<link.icon class="size-4.5 shrink-0" />
					<span>{link.label}</span>
				</a>
			{/each}
		</nav>
	</aside>

	<!-- Main Content Area -->
	<main
		class="min-h-screen transition-all duration-300 ease-in-out {isOpen ? 'md:ml-52' : 'ml-0'}"
	>
		{@render children()}
	</main>
</div>
