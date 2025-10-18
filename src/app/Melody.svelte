<script lang="ts">
	import * as Kbd from '$lib/components/ui/kbd/index.js';
	import Slider from '$lib/components/ui/slider/slider.svelte';
	import Piano from './Piano.svelte';
	import { MeloApi } from './api';
	import { draw } from './draw';
	import { detectScale, midiToNote } from './piano';
	import { onMount } from 'svelte';

	type Props = {
		cheatUpdate?: number;
		noteRange: [number, number];
	};

	let { cheatUpdate = $bindable(1), noteRange = $bindable([0, 0]) }: Props = $props();

	let canvas = $state<HTMLCanvasElement>();
	let ctx = $derived.by(() => canvas?.getContext('2d'));

	function onResize() {
		if (!canvas) return;

		canvas.width = canvas.parentElement!.clientWidth;
		canvas.height = canvas.parentElement!.clientHeight;
	}

	onMount(() => {
		onResize();

		if (ctx) {
			draw(ctx, noteRange, MeloApi.SAMPLES, MeloApi.NOTES, MeloApi.GATE);
		}
	});

	$effect(() => {
		if (ctx && cheatUpdate) {
			draw(ctx, noteRange, MeloApi.SAMPLES, MeloApi.NOTES, MeloApi.GATE);
		}
	});

	let scale = $state(0);
	let scaleName = $derived(detectScale(scale));
</script>

<div class="w-full max-w-2xl flex gap-1 bg-stone-900 p-4 rounded-lg select-none">
	<div class="text-center flex flex-col items-center p-5">
		<span class="text-lg font-bold mx-2">Note Range</span>
		<div class="grid grid-cols-3 w-18">
			<span>{midiToNote(noteRange[0])}</span>
			<span>-</span>
			<span>{midiToNote(noteRange[1])}</span>
		</div>

		<Piano bind:value={scale} />
		<p class="font-sans min-h-10 w-36">{scaleName}</p>

		{#snippet scaleShortcut(key: string, scale: string)}
			<div class="flex flex-col items-start w-full mt-4">
				<div class="flex gap-2">
					<Kbd.Root>{key}</Kbd.Root>+<Kbd.Root>Click</Kbd.Root>
				</div>
				<p class="whitespace-nowrap text-sm">for {scale} scale</p>
			</div>
		{/snippet}

		{@render scaleShortcut('Ctrl', 'Major')}
		{@render scaleShortcut('Shift', 'Pentatonic')}
	</div>

	<Slider type="multiple" orientation="vertical" bind:value={noteRange} min={21} max={108} />

	<div class="flex-1">
		<canvas bind:this={canvas}></canvas>
	</div>
</div>
