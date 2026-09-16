<script lang="ts">
	import { X, ExternalLink, FolderGit2, Calendar } from '@lucide/svelte';
	import { base } from '$app/paths';
	import type { Project } from '$lib/types';
	import { projectModal, closeProjectModal } from '$lib/project-modal.svelte';
	import { lockScroll, unlockScroll } from '$lib/scroll-lock';

	let {
		project: propProject = null,
		onclose: propOnclose
	}: {
		project?: Project | null;
		onclose?: () => void;
	} = $props();

	let isClosing = $state(false);
	let activeProject = $state<Project | null>(null);

	const targetProject = $derived(propProject ?? projectModal.project);
	const shouldBeOpen = $derived(Boolean(targetProject && (propProject !== null || projectModal.open)));

	$effect(() => {
		if (shouldBeOpen && targetProject) {
			activeProject = targetProject;
			isClosing = false;
		} else if (!shouldBeOpen && activeProject && !isClosing) {
			isClosing = true;
			setTimeout(() => {
				isClosing = false;
				activeProject = null;
			}, 180);
		}
	});

	const isLocked = $derived(Boolean(activeProject));
	$effect(() => {
		if (isLocked) {
			lockScroll();
			return () => {
				unlockScroll();
			};
		}
	});

	function handleClose() {
		if (isClosing || !activeProject) return;
		isClosing = true;
		setTimeout(() => {
			isClosing = false;
			activeProject = null;
			closeProjectModal();
			propOnclose?.();
		}, 180);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!activeProject || isClosing) return;
		if (e.key === 'Escape') {
			handleClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if activeProject}
	<div
		role="dialog"
		aria-modal="true"
		aria-labelledby="project-modal-title"
		tabindex="-1"
		onclick={(e) => {
			if (e.target === e.currentTarget) handleClose();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') handleClose();
		}}
		class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-black/80 p-4 backdrop-blur-md select-none {isClosing
			? 'anim-modal-backdrop-out'
			: 'anim-modal-backdrop-in'}"
	>
		<!-- Modal Dialog Card -->
		<div
			class="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-y-auto overscroll-contain rounded-3xl border border-accent/30 bg-surface/95 p-5 text-left shadow-2xl shadow-accent/20 backdrop-blur-md will-change-transform sm:p-7 {isClosing
				? 'anim-modal-out'
				: 'anim-modal-in'}"
		>
			<!-- Close Button -->
			<button
				type="button"
				onclick={handleClose}
				aria-label="Close project details"
				class="absolute top-4 right-4 z-10 cursor-pointer rounded-xl p-1.5 text-muted transition-colors hover:bg-white/10 hover:text-white focus:outline-hidden"
			>
				<X class="size-5" />
			</button>

			<!-- Project Cover Image -->
			{#if activeProject.cover_url}
				<div
					class="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-bg"
				>
					<img
						src="{base}{activeProject.cover_url}"
						alt={activeProject.title}
						class="size-full object-cover"
					/>
				</div>
			{/if}

			<!-- Title & Date -->
			<div class="mt-5 flex flex-wrap items-start justify-between gap-3">
				<h3
					id="project-modal-title"
					class="font-sans text-xl font-extrabold tracking-tight text-white sm:text-2xl"
				>
					{activeProject.title}
				</h3>

				{#if activeProject.date}
					<span
						class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-bold text-accent"
					>
						<Calendar class="size-3.5" />
						{activeProject.date}
					</span>
				{/if}
			</div>

			<!-- Tags List -->
			{#if activeProject.tags && activeProject.tags.length > 0}
				<div class="mt-3 flex flex-wrap gap-1.5">
					{#each activeProject.tags as tag (tag)}
						<span
							class="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-bold text-muted"
						>
							{tag}
						</span>
					{/each}
				</div>
			{/if}

			<!-- Full Project Description -->
			<p class="mt-4 text-left text-sm leading-relaxed text-muted sm:text-base">
				{activeProject.description}
			</p>

			<!-- Action Links -->
			{#if activeProject.demo_url || activeProject.github_url}
				<div class="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-4">
					{#if activeProject.demo_url}
						<a
							href={activeProject.demo_url}
							target="_blank"
							rel="external noreferrer"
							class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-extrabold text-black shadow-lg shadow-accent/20 transition-all duration-200 hover:scale-[1.02] hover:bg-accent-soft active:scale-95 sm:flex-none"
						>
							<ExternalLink class="size-4" />
							Live Demo
						</a>
					{/if}

					{#if activeProject.github_url}
						<a
							href={activeProject.github_url}
							target="_blank"
							rel="external noreferrer"
							class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-extrabold text-white transition-all duration-200 hover:scale-[1.02] hover:border-white/30 hover:bg-white/10 active:scale-95 sm:flex-none"
						>
							<FolderGit2 class="size-4 text-accent" />
							View on GitHub
						</a>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}
