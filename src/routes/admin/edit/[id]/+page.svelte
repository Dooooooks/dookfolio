<script lang="ts">
	import ProjectForm from '../../ProjectForm.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Edit Project — Lloyd Nicolas</title>
</svelte:head>

<h1 class="text-3xl font-extrabold">Edit Project</h1>

<ProjectForm project={data.project} {form} />
