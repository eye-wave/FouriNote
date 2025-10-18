<script lang="ts">
	import * as Kbd from '$lib/components/ui/kbd/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import Slider from '$lib/components/ui/slider/slider.svelte';
	import Piano from './Piano.svelte';
	import { BUFFER_SIZE, MeloApi } from './api';
	import { draw, PIANO_WIDTH } from './draw';
	import { detectScale, midiToNote, NOTE_NAMES } from './piano';
	import { onMount } from 'svelte';

	type Props = {
		cheatUpdate?: number;
		noteRange: [number, number];
		scale: number;
		onUpdate?: (i: number, v: number) => void;
	};

	let {
		cheatUpdate = $bindable(1),
		noteRange = $bindable([0, 0]),
		scale = $bindable(0),
		onUpdate
	}: Props = $props();

	let box = $state<DOMRect>({ left: 0, top: 0, width: 0, height: 0 } as DOMRect);
	let canvas = $state<HTMLCanvasElement>();
	let ctx = $derived.by(() => canvas?.getContext('2d'));

	let mouse = $state({ x: 0, y: 0, down: false });

	function downsamplePosition(mouseX: number) {
		let x = mouseX / (box.width - PIANO_WIDTH);
		x = (x * BUFFER_SIZE) | 0;

		return x;
	}

	function normalizeY(mouseY: number) {
		const y = (mouseY / box.height) * 2;

		return y - 1;
	}

	let currentNoteName = $state('C');
	let currentNotePosition = $derived(downsamplePosition(mouse.x));

	$effect(() => {
		const y = mouse.y;

		MeloApi.countNoteInRange(noteRange, scale)
			.then((count) => (count - (y / box.height) * count) | 0)
			.then((y) =>
				MeloApi.getNthNoteInScale(y, noteRange, scale).then((note) => {
					currentNoteName = midiToNote(note, true);
				})
			);
	});

	function clamp(v: number, min: number, max: number) {
		return Math.max(Math.min(max, v), min);
	}

	async function onMouseMove(e: MouseEvent) {
		if (box.width === 0 && canvas) box = canvas.getBoundingClientRect();

		const _x = e.clientX - box.left;
		const _y = e.clientY - box.top;

		mouse.x = clamp(_x - PIANO_WIDTH, 0, box.width - PIANO_WIDTH);
		mouse.y = clamp(_y, 0, box.height);

		if (!mouse.down) return;

		const x = downsamplePosition(mouse.x);
		const y = normalizeY(mouse.y);

		onUpdate?.(x, y);
	}

	let drawGraph = $state(true);

	function onResize() {
		if (!canvas) return;

		canvas.width = canvas.parentElement!.clientWidth;
		canvas.height = canvas.parentElement!.clientHeight;
	}

	function onMouseOver() {
		if (!canvas) return;

		box = canvas.getBoundingClientRect();
	}

	onMount(() => {
		onResize();

		if (ctx) {
			draw(ctx, noteRange, scale, MeloApi.SAMPLES, MeloApi.NOTES, MeloApi.GATE, drawGraph);
		}
	});

	$effect(() => {
		if (ctx && cheatUpdate) {
			draw(ctx, noteRange, scale, MeloApi.SAMPLES, MeloApi.NOTES, MeloApi.GATE, drawGraph);
		}
	});

	let scaleName = $derived(detectScale(scale));
</script>

<div class="w-full max-w-2xl bg-stone-900 p-4 rounded-lg select-none">
	<div class="flex gap-1">
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
						<Kbd.Root>{key}</Kbd.Root>+ click
					</div>
					<p class="whitespace-nowrap text-sm">for {scale} scale</p>
				</div>
			{/snippet}

			{@render scaleShortcut('Ctrl', 'Major')}
			{@render scaleShortcut('Shift', 'Pentatonic')}
		</div>

		<div class="flex-1 w-full">
			<p class="font-mono text-end text-xs italic">Note {currentNotePosition}, {currentNoteName}</p>

			<div class="flex-1 h-full flex gap-2">
				<Slider type="multiple" orientation="vertical" bind:value={noteRange} min={21} max={108} />

				<div class="flex-1">
					<canvas
						bind:this={canvas}
						onmouseup={() => (mouse.down = false)}
						onmouseleave={() => (mouse.down = false)}
						onmousedown={() => (mouse.down = true)}
						onmousemove={onMouseMove}
						onmouseenter={onMouseOver}
					></canvas>
				</div>
			</div>
		</div>
	</div>

	<div class="flex items-center gap-3 ml-auto w-fit mt-4">
		<input type="checkbox" id="draw-grid" bind:checked={drawGraph} />
		<Label for="draw-grid">Draw graph</Label>
	</div>
</div>
