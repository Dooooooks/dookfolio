<script lang="ts">
	import '@fontsource-variable/nunito';
	import '@fontsource-variable/pixelify-sans';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import profile from '$lib/assets/profile.png';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Briefcase, House, Newspaper, User } from '@lucide/svelte';
	import { gameDevMode } from '$lib/game-mode.svelte';

	let { children } = $props();

	const links = [
		{ href: '/', label: 'Home', icon: House },
    { href: '/#about', label: 'About', icon: User },
		{ href: '/projects', label: 'Projects', icon: Newspaper },
		{ href: '/experiences', label: 'Experiences', icon: Briefcase }
	] as const;
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-bg {gameDevMode.active ? 'font-pixel' : 'font-sans'}">
	<aside
		class="fixed inset-y-0 left-0 z-10 flex w-16 flex-col bg-surface px-2.5 py-6 md:w-52 md:px-4"
	>
		<div class="flex items-center justify-center gap-3 md:justify-start md:px-1">
			<img src={profile} alt="Lloyd Nicolas" class="size-9 shrink-0 rounded-full object-cover" />
			<div class="hidden md:block">
				<p class="text-sm font-extrabold text-white">Lloyd Nicolas</p>
				<p class="text-xs font-bold text-accent">Developer</p>
			</div>
		</div>

		<nav class="mt-12 flex flex-col gap-1.5">
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
					class="flex items-center justify-center gap-3 rounded-lg px-3 py-2 text-sm font-bold transition-colors md:justify-start {active
						? 'bg-white/6 text-white'
						: 'text-muted hover:bg-white/4 hover:text-white'}"
				>
					<link.icon class="size-4.5 shrink-0" />
					<span class="hidden md:inline">{link.label}</span>
				</a>
			{/each}
		</nav>
	</aside>

	<main class="ml-16 min-h-screen md:ml-52">
		{@render children()}
	</main>
</div>
