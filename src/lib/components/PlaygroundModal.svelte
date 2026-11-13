<script lang="ts">
	import { ChevronRight, Ear, Gamepad2, Keyboard, Music, Piano, Timer, X } from '@lucide/svelte';
	import type { Component } from 'svelte';
	import {
		gameDevMode,
		playgroundModal,
		closePlaygroundModal,
		openChordModal,
		openPianoModal,
		openReactionModal,
		openTypingModal,
		type PlaygroundCategory
	} from '$lib/game-mode.svelte';
	import { lockScroll, unlockScroll } from '$lib/scroll-lock';

	interface Activity {
		title: string;
		description: string;
		icon: Component;
		open: () => void;
		// Needs a physical keyboard, so it's hidden on phones and tablets
		desktopOnly?: boolean;
	}

	interface Hobby {
		title: string;
		blurb: string;
		icon: Component;
		activities: Activity[];
	}

	// Each hobby and the playground activities that belong to it; add new ones here
	const HOBBIES: Record<PlaygroundCategory, Hobby> = {
		games: {
			title: 'Games',
			blurb: 'Gaming is one of my hobbies, so here are a few small games I made for fun.',
			icon: Gamepad2,
			activities: [
				{
					title: 'Are you faster than a duck?',
					description: 'A reaction-time test. Click the moment the screen changes.',
					icon: Timer,
					open: openReactionModal
				},
				{
					title: 'Keyboard Warrior',
					description:
						'Type the words on incoming meteors before they hit the duck. How long can you survive?',
					icon: Keyboard,
					open: openTypingModal
				}
			]
		},
		music: {
			title: 'Music',
			blurb: 'Music is my other hobby. Play a few notes or put your ears to the test.',
			icon: Music,
			activities: [
				{
					title: 'Duck Piano',
					description: 'A three-octave piano you play with your computer keyboard.',
					icon: Piano,
					open: openPianoModal,
					desktopOnly: true
				},
				{
					title: 'Chord Progression',
					description: 'Ear training: hear four chords and name the progression.',
					icon: Ear,
					open: openChordModal
				}
			]
		}
	};

	let isClosing = $state(false);
	let isVisible = $state(false);

	const hobby = $derived(HOBBIES[playgroundModal.category]);

	$effect(() => {
		if (playgroundModal.open && !isVisible && !isClosing) {
			isVisible = true;
		} else if (!playgroundModal.open && isVisible && !isClosing) {
			isClosing = true;
			setTimeout(() => {
				isClosing = false;
				isVisible = false;
			}, 180);
		}
	});

	const isLocked = $derived(isVisible || isClosing);
	$effect(() => {
		if (isLocked) {
			lockScroll();
			return () => {
				unlockScroll();
			};
		}
	});

	function handleClose() {
		if (isClosing || !isVisible) return;
		closePlaygroundModal();
	}

	// The hub fades out while the chosen activity's modal opens on top of it
	function launch(activity: Activity) {
		closePlaygroundModal();
		activity.open();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (isVisible && !isClosing && e.key === 'Escape') handleClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isVisible}
	<div
		role="dialog"
		aria-modal="true"
		aria-labelledby="playground-title"
		tabindex="-1"
		onclick={(e) => {
			if (e.target === e.currentTarget) handleClose();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') handleClose();
		}}
		class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain p-4 select-none"
	>
		<!-- Blurred backdrop as a sibling layer so the card's frosted glass can see the page -->
		<div
			aria-hidden="true"
			class="pointer-events-none fixed inset-0 bg-black/20 backdrop-blur-sm {isClosing
				? 'anim-modal-backdrop-out'
				: 'anim-modal-backdrop-in'}"
		></div>

		<!-- Liquid glass card -->
		<div
			class="relative flex w-full max-w-lg flex-col overflow-hidden rounded-none bg-surface/70 p-6 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.5)] backdrop-blur-lg will-change-transform sm:p-8 {isClosing
				? 'anim-modal-out'
				: 'anim-modal-in'}"
		>
			<button
				type="button"
				onclick={handleClose}
				aria-label="Close dialog"
				class="absolute top-4 right-4 cursor-pointer rounded-none p-1.5 text-muted transition-colors hover:bg-white/10 hover:text-white focus:outline-hidden"
			>
				<X class="size-5" />
			</button>

			<!-- Hobby header -->
			<div class="mb-1 flex items-center gap-2 text-accent">
				<hobby.icon class="size-5" />
				<h3
					id="playground-title"
					class="font-extrabold tracking-wide text-white {gameDevMode.active
						? 'font-pixel text-xs sm:text-sm'
						: 'font-sans text-lg sm:text-xl'}"
				>
					{hobby.title}
				</h3>
			</div>
			<p class="mb-5 pr-8 text-muted {gameDevMode.active ? 'text-[8px] leading-loose' : 'text-sm'}">
				{hobby.blurb}
			</p>

			<!-- Activities in this hobby -->
			<div class="flex flex-col gap-2.5">
				{#each hobby.activities as activity (activity.title)}
					<button
						type="button"
						onclick={() => launch(activity)}
						class="group w-full cursor-pointer items-center gap-3.5 rounded-none bg-white/[0.04] p-3.5 text-left shadow-[0_10px_24px_-12px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.25)] backdrop-blur-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/[0.07] hover:shadow-[0_18px_36px_-14px_rgba(0,0,0,0.75),0_0_24px_-8px_rgba(182,148,255,0.25),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(0,0,0,0.25)] active:translate-y-0 active:shadow-[0_6px_14px_-8px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.06)] {activity.desktopOnly
							? 'hidden md:pointer-fine:flex'
							: 'flex'}"
					>
						<span
							class="flex size-10 shrink-0 items-center justify-center rounded-none bg-accent/15 text-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_10px_-4px_rgba(0,0,0,0.5)]"
						>
							<activity.icon class="size-5" />
						</span>
						<span class="flex min-w-0 flex-1 flex-col gap-0.5">
							<span
								class="font-bold text-white {gameDevMode.active
									? 'font-pixel text-[9px]'
									: 'text-sm'}"
							>
								{activity.title}
							</span>
							<span
								class="text-muted {gameDevMode.active ? 'text-[7px] leading-relaxed' : 'text-xs'}"
							>
								{activity.description}
							</span>
						</span>
						<ChevronRight
							class="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
						/>
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}
