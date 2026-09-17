<script lang="ts">
	import { ArrowLeft, Calendar, Clock, User, Tag } from '@lucide/svelte';
	import { base, resolve } from '$app/paths';
	import { gameDevMode } from '$lib/game-mode.svelte';
	import profileImg from '$lib/assets/profile.png';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const blog = $derived(data.blog);
</script>

<svelte:head>
	<title>{blog.title} — Lloyd Nicolas</title>
	<meta name="description" content={blog.description} />
	<meta property="og:title" content={blog.title} />
	<meta property="og:description" content={blog.description} />
	{#if blog.cover}
		<meta property="og:image" content={blog.cover.startsWith('http') ? blog.cover : `${base}${blog.cover}`} />
	{/if}
</svelte:head>

<article class="relative flex min-h-screen flex-col px-6 py-14 pb-32 md:px-12">
	<!-- Top Navigation -->
	<div class="mx-auto w-full max-w-3xl">
		<a
			href={resolve('/blogs')}
			class="group inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-white"
		>
			<ArrowLeft class="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
			Back to Blogs
		</a>
	</div>

	<!-- Article Header -->
	<header class="mx-auto mt-8 w-full max-w-3xl">
		<!-- Tags -->
		{#if blog.tags.length > 0}
			<div class="flex flex-wrap gap-2 mb-4">
				{#each blog.tags as tag}
					<span
						class="rounded-md border border-accent/25 bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent"
					>
						#{tag}
					</span>
				{/each}
			</div>
		{/if}

		<!-- Title -->
		<h1
			class="text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl {gameDevMode.active
				? 'font-pixel text-xl sm:text-2xl'
				: ''}"
		>
			{blog.title}
		</h1>

		<!-- Metadata & Author bar -->
		<div class="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-white/8 py-3.5 text-xs sm:text-sm font-bold text-muted">
			<div class="flex items-center gap-2.5">
				<img
					src={profileImg}
					alt={blog.author}
					class="size-8 rounded-full object-cover ring-1 ring-accent/40"
				/>
				<span class="text-white font-extrabold">{blog.author}</span>
			</div>

			<div class="flex items-center gap-4 text-xs font-extrabold text-muted">
				<span class="inline-flex items-center gap-1.5 text-accent">
					<Calendar class="size-3.5" />
					{blog.formattedDate}
				</span>
				<span class="text-white/20">•</span>
				<span class="inline-flex items-center gap-1">
					<Clock class="size-3.5" />
					{blog.readTime}
				</span>
			</div>
		</div>

		<!-- Single Cover Page Picture (Only one image banner, if provided in markdown) -->
		{#if blog.cover}
			<div class="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-2xl">
				<img
					src="{blog.cover.startsWith('http') ? '' : base}{blog.cover}"
					alt={blog.title}
					loading="eager"
					decoding="async"
					class="size-full object-cover"
				/>
			</div>
		{/if}
	</header>

	<!-- Markdown Article Body -->
	<section class="mx-auto mt-10 w-full max-w-3xl">
		<div class="blog-prose leading-relaxed">
			{@html blog.html}
		</div>

		<!-- Article Footer -->
		<footer class="mt-16 border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
			<a
				href={resolve('/blogs')}
				class="group inline-flex items-center gap-2 rounded-full border border-accent/40 bg-surface/80 px-5 py-2 text-xs font-extrabold text-accent transition-all hover:bg-accent/15 hover:border-accent"
			>
				<ArrowLeft class="size-3.5 transition-transform duration-200 group-hover:-translate-x-1" />
				All Blog Posts
			</a>

			<span class="text-xs text-muted">
				Written by <strong class="text-white">{blog.author}</strong>
			</span>
		</footer>
	</section>
</article>

<style>
	/* Clean minimalist markdown styling with dark theme support */
	:global(.blog-prose) {
		color: #c4bcd8;
		font-size: 1.0625rem;
		line-height: 1.8;
	}

	:global(.blog-prose h2) {
		color: #ffffff;
		font-size: 1.65rem;
		font-weight: 800;
		margin-top: 2.5rem;
		margin-bottom: 1rem;
		line-height: 1.3;
	}

	:global(.blog-prose h3) {
		color: #ffffff;
		font-size: 1.25rem;
		font-weight: 800;
		margin-top: 2rem;
		margin-bottom: 0.75rem;
	}

	:global(.blog-prose p) {
		margin-bottom: 1.25rem;
	}

	:global(.blog-prose strong) {
		color: #ffffff;
		font-weight: 700;
	}

	:global(.blog-prose a) {
		color: #b694ff;
		text-decoration: underline;
		text-underline-offset: 3px;
		font-weight: 700;
		transition: color 0.15s ease;
	}

	:global(.blog-prose a:hover) {
		color: #ffffff;
	}

	:global(.blog-prose ul) {
		list-style-type: disc;
		padding-left: 1.5rem;
		margin-bottom: 1.25rem;
	}

	:global(.blog-prose ol) {
		list-style-type: decimal;
		padding-left: 1.5rem;
		margin-bottom: 1.25rem;
	}

	:global(.blog-prose li) {
		margin-bottom: 0.5rem;
	}

	:global(.blog-prose blockquote) {
		border-left: 3px solid #b694ff;
		padding-left: 1.25rem;
		margin: 1.75rem 0;
		color: #d1c8e8;
		font-style: italic;
		background: rgba(182, 148, 255, 0.05);
		padding-top: 0.75rem;
		padding-bottom: 0.75rem;
		border-radius: 0 0.5rem 0.5rem 0;
	}

	:global(.blog-prose code) {
		background: rgba(255, 255, 255, 0.08);
		color: #cbb1ff;
		padding: 0.2rem 0.4rem;
		border-radius: 0.375rem;
		font-size: 0.9em;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	}

	:global(.blog-prose pre) {
		background: #171622;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.875rem;
		padding: 1.25rem;
		overflow-x: auto;
		margin: 1.75rem 0;
	}

	:global(.blog-prose pre code) {
		background: transparent;
		color: #e2daf5;
		padding: 0;
		font-size: 0.875rem;
		line-height: 1.6;
	}

	:global(.blog-prose hr) {
		border: 0;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		margin: 2.5rem 0;
	}

	:global(.blog-prose img) {
		border-radius: 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		margin: 1.75rem auto;
		max-width: 100%;
		height: auto;
	}
</style>
