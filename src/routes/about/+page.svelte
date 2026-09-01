<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		goto('/#about', { replaceState: true });
	});
</script>

<svelte:head>
	<title>About — Lloyd Nicolas</title>
</svelte:head>

