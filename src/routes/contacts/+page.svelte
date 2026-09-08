<script lang="ts">
	import { ArrowLeft, Mail, Phone } from '@lucide/svelte';
	import { resolve } from '$app/paths';

	const contacts = [
		{
			label: 'Email',
			value: 'dook13s@proton.me',
			href: 'mailto:dook13s@proton.me',
			external: false
		},
		{
			label: 'Phone',
			value: '+63 977 670 6650',
			href: 'tel:+639776706650',
			external: false
		},
		{
			label: 'GitHub',
			value: 'github.com/Dooooooks',
			href: 'https://github.com/Dooooooks',
			external: true
		},
		{
			label: 'LinkedIn',
			value: 'linkedin.com/in/lloyd-danielle-nicolas-666352359',
			href: 'https://www.linkedin.com/in/lloyd-danielle-nicolas-666352359',
			external: true
		}
	];
</script>

<svelte:head>
	<title>Contacts — Lloyd Nicolas</title>
</svelte:head>

<section class="relative flex min-h-screen flex-col px-8 py-16 pb-[40vh] md:px-12">
	<a
		href={resolve('/')}
		class="absolute top-8 left-8 inline-flex items-center gap-2 text-sm font-bold text-muted transition-colors hover:text-white md:top-10 md:left-12"
	>
		<ArrowLeft class="size-4" />
		Back to Home
	</a>

	<div class="mx-auto my-auto w-full max-w-2xl">
		<h1 class="text-3xl font-extrabold">Contacts</h1>

		<p class="mt-4 text-base leading-relaxed text-muted md:text-lg">
			Let's build something together. Reach out through any of the channels below.
		</p>

		<ul class="mt-8 space-y-3">
			{#each contacts as contact (contact.label)}
				<li>
					<a
						href={contact.href}
						rel="external"
						target={contact.external ? '_blank' : undefined}
						class="group flex items-center gap-4 rounded-xl border border-white/8 bg-surface px-5 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/30"
					>
						<span
							class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent"
						>
							{#if contact.label === 'Email'}
								<Mail class="size-5" />
							{:else if contact.label === 'Phone'}
								<Phone class="size-5" />
							{:else if contact.label === 'GitHub'}
								<svg class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
									<path
										fill-rule="evenodd"
										clip-rule="evenodd"
										d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z"
									/>
								</svg>
							{:else if contact.label === 'LinkedIn'}
								<svg class="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
									<path
										d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
									/>
								</svg>
							{/if}
						</span>

						<span class="flex min-w-0 flex-col">
							<span class="text-xs font-bold tracking-widest text-muted uppercase">
								{contact.label}
							</span>
							<span
								class="mt-0.5 truncate text-sm font-extrabold text-white transition-colors group-hover:text-accent"
							>
								{contact.value}
							</span>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</div>
</section>
