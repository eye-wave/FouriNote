<script lang="ts">
	import * as ContextMenu from '$lib/components/ui/context-menu/index';
	import { detectScale, isNoteBlack } from './piano';
	import { range } from './range';

	type Props = { value: number };

	let { value: scale = $bindable(0) }: Props = $props();

	function flipBit(pos: number) {
		if (pos < 0 || pos > 31) throw new Error('Bit position must be 0-31');
		scale ^= 1 << pos;
	}

	function isBitSet(pos: number) {
		return ((scale >> pos) & 1) === 1;
	}
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger>
		<div class="flex rounded-sm overflow-hidden">
			{#each range(0, 12) as i}
				{@const isBlack = isNoteBlack(i)}
				{@const isActive = isBitSet(i)}

				<div
					onclick={() => flipBit(i)}
					class="bg-lime-400"
					data-active={isActive}
					class:white={!isBlack}
					class:black={isBlack}
				></div>
			{/each}
		</div>
	</ContextMenu.Trigger>
	<ContextMenu.Content>
		<ContextMenu.Item onclick={() => (scale = 0)}>Clear</ContextMenu.Item>
	</ContextMenu.Content>
</ContextMenu.Root>

<style lang="postcss">
	@reference "../global.css";

	.white:not([data-active='true']) {
		@apply bg-gradient-to-l from-white to-stone-300;
	}

	.white {
		@apply h-12 w-4;
	}

	.black:not([data-active='true']) {
		@apply bg-black;
	}

	.black {
		@apply z-1 -mx-1.5 h-8 w-3 rounded-b-xs;
	}
</style>
