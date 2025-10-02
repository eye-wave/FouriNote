<script lang="ts">
	import * as ContextMenu from '$lib/components/ui/context-menu/index';
	import { normalize, range } from './range';

	type Buffer = Float32Array | Uint8Array;

	type Props = {
		buffer: Buffer;
		bins: number;
		label?: string;
		min?: number;
		max?: number;
		oninput?: (value: number, index: number) => void;
		onclear?: () => void;
		onrandomize?: () => void;
		snippet?: (value: number, index: number) => ReturnType<import('svelte').Snippet>;
		cheatUpdate?: number;
	};

	let isMouseDown = false;
	let box: DOMRect | undefined = undefined;

	let {
		bins,
		buffer,
		label,
		min = -1.0,
		max = 1.0,
		oninput,
		onclear,
		onrandomize,
		snippet,
		cheatUpdate = $bindable(0)
	}: Props = $props();

	let ref = $state<HTMLDivElement>();
	let isByte = $derived(buffer instanceof Uint8Array);

	const indicies: boolean[] | null = isByte ? Array(bins).fill(false) : null;

	function updateSlider(e: MouseEvent, box: DOMRect) {
		const x = e.clientX - box.left;
		const widthPerBar = box.width / bins;

		let index = Math.floor(x / widthPerBar);
		index = Math.max(0, Math.min(bins - 1, index));

		if (buffer instanceof Float32Array) {
			const y = e.clientY - box.top;
			const height = box.height;
			const normalized = 1 - y / height;

			const value = min + normalized * (max - min);
			oninput?.(Math.min(Math.max(value, min), max), index);
		} else {
			if (!indicies![index]) {
				oninput?.(+!buffer[index], index);
				indicies![index] = true;
			}
		}

		cheatUpdate += 1;
	}

	function onMouseMove(e: MouseEvent) {
		if (!isMouseDown || !box) return;

		updateSlider(e, box);
	}

	function onMouseDown(e: MouseEvent) {
		if (e.button !== 0) return;

		isMouseDown = true;
		box = ref?.getBoundingClientRect();

		indicies && indicies.forEach((_, i, arr) => (arr[i] = false));
		if (box) updateSlider(e, box);
	}
</script>

<svelte:window onmouseup={() => (isMouseDown = false)} onmousemove={onMouseMove} />

{#snippet defaultSlider(value: number, i: number)}
	{@const isOdd = (i & 1) === 0}

	<div
		class="h-12"
		class:w-4={!isByte}
		class:w-2={isByte}
		class:bg-stone-700={isOdd}
		class:bg-stone-600={!isOdd}
		onmousedown={onMouseDown}
		draggable="false"
	>
		<div class="w-full bg-blue-500 h-full origin-bottom" style:transform="scale(1,{value})"></div>
	</div>
{/snippet}

<div draggable="false" class="select-none">
	{#if label}
		<p draggable="false">{label}</p>
	{/if}

	<ContextMenu.Root>
		<ContextMenu.Trigger>
			<div class="flex w-fit h-full" draggable="false" bind:this={ref}>
				{#key cheatUpdate}
					{#each range(0, bins) as i}
						{@const value = Math.min(max, Math.max(min, normalize(buffer[i], min, max)))}

						{@render (snippet ?? defaultSlider)(value, i)}
					{/each}
				{/key}
			</div>
		</ContextMenu.Trigger>
		<ContextMenu.Content>
			<ContextMenu.Item onclick={onclear}>Clear</ContextMenu.Item>
			<ContextMenu.Item onclick={onrandomize}>Randomize</ContextMenu.Item>
		</ContextMenu.Content>
	</ContextMenu.Root>
</div>
