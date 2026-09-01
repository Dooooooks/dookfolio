<script lang="ts">
	import ExperienceForm from '../../../ExperienceForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Edit Experience — Lloyd Nicolas</title>
</svelte:head>

<h1 class="text-3xl font-extrabold">Edit Experience</h1>

<ExperienceForm experience={data.experience} {form} />
