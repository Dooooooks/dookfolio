<script lang="ts">
	import { Code, Database, Gamepad2, Terminal, Palette, Sparkles } from '@lucide/svelte';
	import { SKILL_CATEGORIES } from '$lib/data/skills';
	import { gameDevMode } from '$lib/game-mode.svelte';
	import { reveal } from '$lib/actions/reveal';

	const categoryIcons = {
		frontend: Code,
		backend: Database,
		game: Gamepad2,
		systems: Terminal,
		design: Palette
	};
</script>

<div id="skills" class="mt-12 scroll-mt-24">
	<div class="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
		<h3
			use:reveal={{ y: 20 }}
			class="text-xl font-extrabold text-white md:text-2xl {gameDevMode.active
				? 'font-pixel text-lg'
				: ''}"
		>
			Skills & Technologies
		</h3>
		<span
			use:reveal={{ delay: 60, y: 16 }}
			class="text-xs text-muted {gameDevMode.active ? 'font-pixel text-[8px]' : ''}"
		>
			Dots indicate technologies used in featured projects
		</span>
	</div>

	<div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
		{#each SKILL_CATEGORIES as category, catIndex (category.id)}
			{@const Icon = categoryIcons[category.id]}
			{@const isWide = category.id === 'design'}
			<div
				use:reveal={{ delay: 100 + catIndex * 70, y: 24, scale: 0.94 }}
				class="flex flex-col justify-between rounded-2xl border border-white/8 bg-surface/60 backdrop-blur-xs p-5 transition-all duration-300 hover:border-accent/30 hover:bg-surface/80 hover:shadow-lg hover:shadow-accent/5 {isWide
					? 'sm:col-span-2'
					: ''}"
			>
				<!-- Card Header -->
				<div class="mb-3.5 flex items-center justify-between gap-3 border-b border-white/6 pb-3">
					<div class="flex items-center gap-2.5">
						<div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-accent">
							<Icon class="size-4.5" />
						</div>
						<h4
							class="font-extrabold text-white {gameDevMode.active
								? 'font-pixel text-[11px]'
								: 'text-sm'}"
						>
							{category.title}
						</h4>
					</div>

					<span
						class="rounded-full border border-white/8 bg-white/5 px-2 py-0.5 font-bold text-muted {gameDevMode.active
							? 'font-pixel text-[8px]'
							: 'text-[10px]'}"
					>
						{category.skills.length} skills
					</span>
				</div>

				<!-- Skill Pills -->
				<div class="flex flex-wrap gap-2">
					{#each category.skills as skill (skill.name)}
						<div
							class="group relative inline-flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/4 px-3 py-1.5 cursor-default font-bold text-muted transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.03] hover:border-accent/40 hover:bg-accent/15 hover:text-accent hover:shadow-xs hover:shadow-accent/20 {gameDevMode.active
								? 'font-pixel text-[8.5px]'
								: 'text-xs'}"
							title={skill.project ? `Used in: ${skill.project}` : undefined}
						>
							<span>{skill.name}</span>
							{#if skill.project}
								<span
									class="size-1.5 rounded-full bg-accent/80 transition-transform group-hover:scale-125"
									title={`Used in: ${skill.project}`}
								></span>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
