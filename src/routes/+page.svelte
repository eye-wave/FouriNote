<script lang="ts">
	import { initSync, analyze } from '$wasm/melofft';
	import wasmUrl from '$wasm/melofft_bg.wasm?url';
	import { onMount } from 'svelte';

	onMount(async () => {
		const module = await fetch(wasmUrl).then((res) => res.arrayBuffer());

		initSync({ module });
		analyze();
	});
</script>
