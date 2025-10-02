<script lang="ts" module>
	export const BUFFER_SIZE = 64;
	export const NUM_BINS = BUFFER_SIZE / 2;

	let SAMPLES = new Float32Array(BUFFER_SIZE);
	let GATE = new Uint8Array(BUFFER_SIZE).fill(1);
	let AMPLITUDES = new Float32Array(NUM_BINS);
	let PHASES = new Float32Array(NUM_BINS);
</script>

<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import {
		initSync,
		getAmplitudesPtr,
		getPhasesPtr,
		getSamplesPtr,
		analyze,
		synthesize,
		getGatePtr
	} from '$wasm/melofft';
	import wasmUrl from '$wasm/melofft_bg.wasm?url';
	import Melody from './Melody.svelte';
	import Slider from './Slider.svelte';
	import { onMount } from 'svelte';
	import { Draggable } from 'svelte-knobs';
	import { LinearParam } from 'svelte-knobs/params';

	let cheatUpdate = $state(0);

	let BPMValue = $state(0.0);
	const BPMParam = new LinearParam(60, 200);

	onMount(async () => {
		const module = await fetch(wasmUrl).then((res) => res.arrayBuffer());

		const wasm = initSync({ module });

		SAMPLES = new Float32Array(wasm.memory.buffer, getSamplesPtr(), BUFFER_SIZE);
		GATE = new Uint8Array(wasm.memory.buffer, getGatePtr(), BUFFER_SIZE);
		AMPLITUDES = new Float32Array(wasm.memory.buffer, getAmplitudesPtr(), NUM_BINS);
		PHASES = new Float32Array(wasm.memory.buffer, getPhasesPtr(), NUM_BINS);
	});

	function onUpdate(
		buffer: Float32Array | Uint8Array,
		i: number,
		value: number,
		forward?: boolean
	) {
		buffer[i] = value;

		if (forward !== undefined) {
			(forward ? analyze : synthesize)();
		}

		cheatUpdate += 1;
	}

	function randomize(buffer: Float32Array | Uint8Array, min = 0, max = 1) {
		if (buffer instanceof Float32Array) {
			buffer.forEach((_, i, a) => {
				a[i] = Math.random() * (max - min) + min;
			});
		} else {
			buffer.forEach((_, i, a) => {
				a[i] = Math.random() > 0.5 ? 1.0 : 0.0;
			});
		}

		synthesize();
		cheatUpdate += 1;
	}

	function clear(buffer: Float32Array | Uint8Array, value: number) {
		buffer.fill(value);
		synthesize();

		cheatUpdate += 1;
	}
</script>

<div class="w-full flex flex-col items-center gap-4">
	<Melody
		bind:cheatUpdate
		samples={SAMPLES}
		gate={GATE}
		onUpdate={(v, i) => onUpdate(SAMPLES, i, v, true)}
	/>

	<Slider
		bind:cheatUpdate
		buffer={AMPLITUDES}
		bins={NUM_BINS}
		oninput={(v, i) => onUpdate(AMPLITUDES, i, v, false)}
		onclear={() => clear(AMPLITUDES, 0.0)}
		onrandomize={() => randomize(AMPLITUDES, 0, 50)}
		label="Amplitudes"
		min={0}
		max={50}
	/>
	<Slider
		bind:cheatUpdate
		buffer={PHASES}
		bins={NUM_BINS}
		oninput={(v, i) => onUpdate(PHASES, i, v, false)}
		onclear={() => clear(PHASES, 0.0)}
		onrandomize={() => randomize(PHASES, -Math.PI, Math.PI)}
		label="Phases"
		min={-Math.PI}
		max={Math.PI}
	/>
	<Slider
		bind:cheatUpdate
		buffer={GATE}
		bins={BUFFER_SIZE}
		oninput={(v, i) => onUpdate(GATE, i, v)}
		onclear={() => clear(GATE, 1)}
		onrandomize={() => randomize(GATE)}
		label="Gate"
		min={0}
		max={1}
	/>

	<div class="flex gap-2 items-center">
		<Draggable bind:valueSmoothed={BPMValue}>
			<div class="text-lg bg-stone-800 p-2 w-24 text-center rounded-md grid grid-cols-2">
				<span>BPM</span>
				<span>{BPMParam.denormalize(BPMValue) | 0}</span>
			</div>
		</Draggable>
		<Button>Play</Button>
	</div>
</div>
