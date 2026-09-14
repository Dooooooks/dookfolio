<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	onMount(() => {
		goto(resolve('/#about'), { replaceState: true });
	});
</script>

<svelte:head>
	<title>About — Lloyd Nicolas</title>
</svelte:head>
