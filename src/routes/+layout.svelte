<script lang="ts">
	import { onMount } from 'svelte';
	import '@fontsource-variable/nunito';
	import '@fontsource/press-start-2p';
	import './layout.css';
	import duckWhite from '$lib/assets/duck_white.png';
	import duckYellow from '$lib/assets/duck_yellow.png';
	import profile from '$lib/assets/profile.png';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import {
		Activity,
		Briefcase,
		BookOpen,
		ChevronLeft,
		ChevronRight,
		Gamepad2,
		House,
		Mail,
		Newspaper,
		ShoppingBag,
		User
	} from '@lucide/svelte';
	import {
		gameDevMode,
		openReactionModal,
		openBreakContractModal,
		openShopModal,
		breakContractModal,
		reactionModal,
		shopModal
	} from '$lib/game-mode.svelte';
	import { projectModal } from '$lib/project-modal.svelte';
	import { lockScroll, unlockScroll, forceUnlockScroll } from '$lib/scroll-lock';
	import AbstractTriangleFlanks from '$lib/components/AbstractTriangleFlanks.svelte';
	import DuckReactionModal from '$lib/components/DuckReactionModal.svelte';
	import BreakContractModal from '$lib/components/BreakContractModal.svelte';
	import ProjectModal from '$lib/components/ProjectModal.svelte';
	import QuackShopModal from '$lib/components/QuackShopModal.svelte';

	let { children } = $props();

	let isOpen = $state(true);
	let activeSection = $state<'home' | 'about' | 'activity'>('home');

	onMount(() => {
		if (window.innerWidth < 768) {
			isOpen = false;
		}

		function updateSectionOnScroll() {
			if (page.url.pathname !== '/') return;
			const scrollY = window.scrollY;
			const activityEl = document.getElementById('activity');
			const aboutEl = document.getElementById('about');

			const activityTop = activityEl ? activityEl.offsetTop - 280 : Infinity;
			const aboutTop = aboutEl ? aboutEl.offsetTop - 280 : Infinity;

			if (aboutTop > activityTop) {
				if (scrollY >= aboutTop) {
					activeSection = 'about';
				} else if (scrollY >= activityTop) {
					activeSection = 'activity';
				} else {
					activeSection = 'home';
				}
			} else {
				if (scrollY >= activityTop) {
					activeSection = 'activity';
				} else if (scrollY >= aboutTop) {
					activeSection = 'about';
				} else {
					activeSection = 'home';
				}
			}
		}

		window.addEventListener('scroll', updateSectionOnScroll, { passive: true });
		updateSectionOnScroll();

		return () => {
			window.removeEventListener('scroll', updateSectionOnScroll);
		};
	});

	$effect(() => {
		if (page.url.pathname === '/') {
			if (page.url.hash === '#about') {
				activeSection = 'about';
			} else if (page.url.hash === '#activity') {
				activeSection = 'activity';
			}
		}
	});

	const homeSubsections = [
		{ href: '/#activity', label: 'Activity', icon: Activity, id: 'activity' as const },
		{ href: '/#about', label: 'About', icon: User, id: 'about' as const }
	] as const;

	const otherLinks = [
		{ href: '/projects', label: 'Projects', icon: Newspaper },
		{ href: '/experiences', label: 'Experiences', icon: Briefcase },
		{ href: '/contacts', label: 'Contacts', icon: Mail }
	] as const;

	const isHomeActive = $derived(page.url.pathname === '/' && activeSection === 'home');

	// Lock body scroll on mobile when sidebar drawer is open
	$effect(() => {
		if (typeof window !== 'undefined' && window.innerWidth < 768) {
			if (isOpen) {
				lockScroll();
				return () => {
					unlockScroll();
				};
			}
		}
	});

	// Safeguard: Ensure scroll is unlocked when navigating if no modal is active
	$effect(() => {
		// Track pathname changes
		page.url.pathname;
		if (!breakContractModal.open && !reactionModal.open && !projectModal.open) {
			forceUnlockScroll();
		}
	});
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

	<!-- Break Contract Book Button (Only visible after entering Game Dev Mode) -->
	{#if gameDevMode.active}
		<button
			type="button"
			onclick={openBreakContractModal}
			aria-label="Break Contract with Duck"
			title="Break Contract with Duck (Return to Software Dev Mode)"
			class="fixed top-3.5 z-20 flex size-8 cursor-pointer items-center justify-center rounded-lg border border-accent/40 bg-surface/90 text-accent shadow-lg shadow-accent/20 backdrop-blur transition-all duration-300 hover:scale-110 hover:border-accent hover:bg-accent/20 active:scale-95 {isOpen
				? 'left-13 md:left-56'
				: 'left-13'}"
		>
			<BookOpen class="size-4.5" strokeWidth={1.75} />
		</button>
	{/if}

	<!-- Backdrop on Mobile -->
	{#if isOpen}
		<button
			type="button"
			onclick={() => (isOpen = false)}
			aria-label="Close sidebar backdrop"
			class="fixed inset-0 z-10 bg-black/50 backdrop-blur-xs touch-none md:hidden"
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
				<p class="font-extrabold text-white {gameDevMode.active ? 'text-[8.5px]' : 'text-sm'}">Lloyd Nicolas</p>
				<p class="font-bold text-accent {gameDevMode.active ? 'text-[7.5px]' : 'text-xs'}">
					{gameDevMode.active ? 'Game' : 'Software'} Developer
				</p>
			</div>
		</div>

		<nav class="mt-8 flex flex-1 flex-col gap-1.5 overflow-x-hidden overflow-y-auto overscroll-contain">
			<!-- Home and its Subsections -->
			<div class="flex flex-col gap-1">
				<a
					href={resolve('/')}
					onclick={() => {
						activeSection = 'home';
						if (window.innerWidth < 768) isOpen = false;
					}}
					aria-current={isHomeActive ? 'page' : undefined}
					class="group flex items-center gap-3 rounded-lg px-3 py-2 font-bold transition-all duration-150 {gameDevMode.active
						? 'text-[8.5px]'
						: 'text-sm'} {isHomeActive
						? 'border-l-2 border-accent bg-accent/10 font-extrabold text-accent shadow-sm'
						: 'text-muted hover:translate-x-1 hover:bg-white/5 hover:text-white'}"
				>
					<House
						class="size-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110 {isHomeActive
							? 'text-accent'
							: 'text-muted group-hover:text-white'}"
					/>
					<span>Home</span>
				</a>

				<!-- Subsections under Home -->
				<div class="ml-4.5 flex flex-col gap-0.5 border-l border-white/10 pl-3">
					{#each homeSubsections as sub (sub.href)}
						{@const isSubActive = page.url.pathname === '/' && activeSection === sub.id}
						<a
							href={resolve(sub.href)}
							onclick={() => {
								activeSection = sub.id;
								if (window.innerWidth < 768) isOpen = false;
							}}
							aria-current={isSubActive ? 'page' : undefined}
							class="group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 font-bold transition-all duration-150 {gameDevMode.active
								? 'text-[7.5px]'
								: 'text-xs'} {isSubActive
								? 'border-l-2 border-accent bg-accent/10 font-extrabold text-accent'
								: 'text-muted hover:translate-x-0.5 hover:bg-white/5 hover:text-white'}"
						>
							<sub.icon
								class="size-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110 {isSubActive
									? 'text-accent'
									: 'text-muted group-hover:text-white'}"
							/>
							<span>{sub.label}</span>
						</a>
					{/each}
				</div>
			</div>

			<!-- Other Main Links -->
			{#each otherLinks as link (link.href)}
				{@const active = page.url.pathname === link.href}
				<a
					href={resolve(link.href)}
					onclick={() => {
						if (window.innerWidth < 768) isOpen = false;
					}}
					aria-current={active ? 'page' : undefined}
					class="group flex items-center gap-3 rounded-lg px-3 py-2 font-bold transition-all duration-150 {gameDevMode.active
						? 'text-[8.5px]'
						: 'text-sm'} {active
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

		<!-- Bottom Section: Quack Counter & Playground -->
		<div class="mt-auto flex flex-col">
			{#if gameDevMode.quacks > 0}
				<!-- Quack Counter Section (Above Playground Divider) -->
				<div
					class="anim-fade-in-up mb-3 flex flex-col items-center justify-center gap-1 rounded-2xl border border-accent/25 bg-accent/10 p-2.5 text-center shadow-xs transition-all duration-300"
				>
					<span class="font-extrabold tracking-wider text-accent uppercase {gameDevMode.active ? 'text-[7.5px]' : 'text-[10px]'}">
						Quack Counter
					</span>

					<div class="flex items-baseline justify-center gap-1.5">
						<span class="font-black text-white tracking-tight {gameDevMode.active ? 'text-lg' : 'text-xl sm:text-2xl'}">
							{gameDevMode.quacks.toLocaleString()}
						</span>
						<span class="font-bold text-muted {gameDevMode.active ? 'text-[7.5px]' : 'text-xs'}">
							{gameDevMode.quacks === 1 ? 'quack' : 'quacks'}
						</span>
					</div>

					<!-- Upgrade Shop Button -->
					<button
						type="button"
						onclick={openShopModal}
						class="mt-1 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-accent/30 bg-accent/15 px-3 py-1.5 font-extrabold text-accent shadow-xs transition-all duration-200 hover:scale-[1.02] hover:border-accent hover:bg-accent/25 active:scale-95 {gameDevMode.active
							? 'font-pixel text-[8px]'
							: 'text-xs'}"
					>
						<ShoppingBag class="size-3.5" />
						<span>Upgrade Shop</span>
					</button>
				</div>
			{/if}

			<!-- Playground Section & Email Address -->
			<div class="flex flex-col gap-2.5 border-t border-white/8 pt-3.5">
				<!-- Playground Header -->
				<div class="flex items-center gap-1.5 px-1">
					<Gamepad2 class="size-3.5 text-accent" />
					<span class="font-extrabold tracking-wider text-muted uppercase {gameDevMode.active ? 'text-[7.5px]' : 'text-[10px]'}">
						Playground
					</span>
				</div>

				<!-- Reaction Time Test Button with centered content -->
				<button
					type="button"
					onclick={openReactionModal}
					class="group flex w-full cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-center shadow-xs transition-all duration-150 hover:scale-[1.02] hover:border-accent/40 hover:bg-accent/10 hover:text-white active:scale-95"
				>
					<span class="text-center font-bold text-muted {gameDevMode.active ? 'text-[6px]' : 'text-[10px]'}">Are you faster than a duck?</span>
				</button>

			<!-- Email Address (Affected by Game Mode Switch) -->
			<div class="border-t border-white/6 pt-1">
				<a
					href="mailto:dook13s@proton.me"
					class="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all duration-150 {gameDevMode.active
						? 'border border-[#ffe794]/25 bg-[#ffe794]/10 hover:border-[#ffe794]/45 hover:bg-[#ffe794]/20 hover:shadow-xs hover:shadow-[#ffe794]/15'
						: 'hover:bg-white/5'}"
					title="Send email to dook13s@proton.me"
				>
					{#if gameDevMode.active}
						<img
							src={duckYellow}
							alt="Duck"
							class="size-4 shrink-0 transition-transform duration-200 pixelated group-hover:scale-110 group-hover:rotate-12"
						/>
					{:else}
						<Mail
							class="size-4 shrink-0 text-accent transition-transform duration-200 group-hover:scale-110"
						/>
					{/if}
					<span
						class="font-medium transition-colors {gameDevMode.active
							? 'font-pixel text-[7.5px] text-[#ffe794] group-hover:text-white'
							: 'truncate font-mono text-[11px] tracking-tight text-muted group-hover:text-accent'}"
					>
						dook13s@proton.me
					</span>
				</a>
			</div>
		</div>
	</div>
</aside>

	<!-- Animated Geometric Triangle Flanks (Dynamic Per Tab) -->
	<AbstractTriangleFlanks {isOpen} />

	<!-- Global Reaction Time Challenge Modal (Centered in Viewport) -->
	<DuckReactionModal />

	<!-- Break Contract Confirmation Modal -->
	<BreakContractModal />

	<!-- Project Details Modal (Always Centered in Viewport) -->
	<ProjectModal />

	<!-- Quack Upgrade Shop Modal (Centered in Viewport) -->
	<QuackShopModal />

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
