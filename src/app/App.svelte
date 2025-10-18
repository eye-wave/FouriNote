<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import Melody from './Melody.svelte';
	import Slider from './Slider.svelte';
	import { BUFFER_SIZE, MeloApi, NUM_BINS } from './api';
	import { downloadBuffer } from './download';
	import { Draggable } from 'svelte-knobs';
	import { LinearParam } from 'svelte-knobs/params';

	let cheatUpdate = $state(1);

	let noteRange = $state<[number, number]>([60, 83]);
	let scale = $state(0);

	let BPMValue = $state(0.0);
	const BPMParam = new LinearParam(60, 200);

	async function onUpdate(
		buffer: Float32Array | Uint8Array,
		i: number,
		value: number,
		forward?: boolean
	) {
		buffer[i] = value;

		if (forward !== undefined) {
			await (forward ? MeloApi.analyze : MeloApi.synthesize)();
			await MeloApi.samplesToNotes(noteRange, scale);
		}

		cheatUpdate += 1;
	}

	$effect(() => {
		MeloApi.samplesToNotes(noteRange, scale).then(() => {
			cheatUpdate += 1;
		});
	});

	async function randomize(buffer: Float32Array | Uint8Array, min = 0, max = 1) {
		if (buffer instanceof Float32Array) {
			buffer.forEach((_, i, a) => {
				a[i] = Math.random() * (max - min) + min;
			});
		} else {
			buffer.forEach((_, i, a) => {
				a[i] = Math.random() > 0.5 ? 1.0 : 0.0;
			});
		}

		await MeloApi.synthesize();
		await MeloApi.samplesToNotes(noteRange, scale);

		cheatUpdate += 1;
	}

	async function clear(buffer: Float32Array | Uint8Array, value: number) {
		buffer.fill(value);

		await MeloApi.synthesize();
		await MeloApi.samplesToNotes(noteRange, scale);

		cheatUpdate += 1;
	}
</script>

<div class="w-full flex flex-col items-center gap-4">
	<Melody bind:cheatUpdate bind:noteRange bind:scale />

	<Slider
		bind:cheatUpdate
		buffer={MeloApi.AMPLITUDES}
		bins={NUM_BINS}
		oninput={(v, i) => onUpdate(MeloApi.AMPLITUDES, i, v, false)}
		onclear={() => clear(MeloApi.AMPLITUDES, 0.0)}
		onrandomize={() => randomize(MeloApi.AMPLITUDES, 0, 50)}
		label="Amplitudes"
		min={0}
		max={50}
	/>
	<Slider
		bind:cheatUpdate
		buffer={MeloApi.PHASES}
		bins={NUM_BINS}
		oninput={(v, i) => onUpdate(MeloApi.PHASES, i, v, false)}
		onclear={() => clear(MeloApi.PHASES, 0.0)}
		onrandomize={() => randomize(MeloApi.PHASES, -Math.PI, Math.PI)}
		label="Phases"
		min={-Math.PI}
		max={Math.PI}
	/>
	<Slider
		bind:cheatUpdate
		buffer={MeloApi.GATE}
		bins={BUFFER_SIZE}
		oninput={(v, i) => onUpdate(MeloApi.GATE, i, v)}
		onclear={() => clear(MeloApi.GATE, 1)}
		onrandomize={() => randomize(MeloApi.GATE)}
		label="Gate"
		min={0}
		max={1}
	/>

	<div class="flex gap-2 items-center">
		<Draggable bind:valueSmoothed={BPMValue} defaultValue={0.5}>
			<div
				class="text-lg bg-stone-800 p-2 w-24 text-center rounded-md grid grid-cols-2 select-none"
			>
				<span>BPM</span>
				<span>{BPMParam.denormalize(BPMValue) | 0}</span>
			</div>
		</Draggable>
		<Button
			onclick={async () => {
				const bpm = BPMParam.denormalize(BPMValue);
			}}>Play</Button
		>
		<Button
			onclick={async () => {
				const bpm = BPMParam.denormalize(BPMValue);
				const file = await MeloApi.exportMidiFile(bpm);

				downloadBuffer(file, 'melody.mid');
			}}>Export</Button
		>
	</div>
</div>
