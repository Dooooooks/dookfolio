<script lang="ts">
	import ProjectForm from '../ProjectForm.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>New Project — Lloyd Nicolas</title>
</svelte:head>

<h1 class="text-3xl font-extrabold">New Project</h1>

<ProjectForm {form} />
