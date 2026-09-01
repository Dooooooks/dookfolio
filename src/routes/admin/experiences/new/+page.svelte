<script lang="ts">
	import ExperienceForm from '../../ExperienceForm.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>New Experience — Lloyd Nicolas</title>
</svelte:head>

<h1 class="text-3xl font-extrabold">New Experience</h1>

<ExperienceForm {form} />
