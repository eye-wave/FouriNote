<script lang="ts">
	import Slider from '$lib/components/ui/slider/slider.svelte';
	import { draw } from './melody';
	import { onMount } from 'svelte';

	type Props = {
		samples: Float32Array;
		gate: Uint8Array;
		onUpdate?: (value: number, index: number) => void;
		cheatUpdate?: number;
	};

	let { samples, gate, onUpdate, cheatUpdate = $bindable(0) }: Props = $props();

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
			draw(ctx, noteRange, samples, gate);
		}
	});

	$effect(() => {
		if (ctx && cheatUpdate) {
			draw(ctx, noteRange, samples, gate);
		}
	});

	let noteRange = $state<[number, number]>([60, 83]);
	let noteRangeValue = $derived(noteRange[1] - noteRange[0]);

	function midiToNote(midi: number): string {
		const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
		const octave = Math.floor(midi / 12) - 1;
		const note = notes[midi % 12];
		return `${note}${octave}`;
	}
</script>

{#snippet note(value: number, index: number)}
	{@const val = Math.floor(value * noteRangeValue) / noteRangeValue}
	{@const isOdd = ((index >> 3) & 1) === 0}

	<div class="h-full w-1" class:bg-stone-700={isOdd} class:bg-stone-600={!isOdd}>
		{#if gate[index]}
			<div class="w-full bg-blue-500 h-2" style:transform="translateY({val * 288}px)"></div>
		{/if}
	</div>
{/snippet}

<div class="w-full max-w-xl flex gap-1 h-72">
	<div class="text-center flex flex-col items-center py-4">
		<span>Note Range</span>
		<div class="grid grid-cols-3 w-18">
			<span>{midiToNote(noteRange[0])}</span>
			<span>-</span>
			<span>{midiToNote(noteRange[1])}</span>
		</div>
	</div>

	<Slider type="multiple" orientation="vertical" bind:value={noteRange} min={21} max={108} />

	<div class="flex-1">
		<canvas bind:this={canvas}></canvas>
	</div>
</div>
