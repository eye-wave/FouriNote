import {
	initSync,
	ana as analyze,
	cnr as countNoteInRange,
	dsn as samplesToNotes,
	emf as exportMidiFile,
	gap as getAmplitudesPtr,
	ggp as getGatePtr,
	gnp as getNotesPtr,
	gpp as getPhasesPtr,
	gsn as getSampleNorm,
	gsp as getSamplesPtr,
	ins as isNoteInScale,
	nns as getNthNoteInScale,
	syn as synthesize,
	type InitOutput
} from '$wasm/melofft';
import wasmUrl from '$wasm/melofft_bg.wasm?url';

export const BUFFER_SIZE = 64;
export const NUM_BINS = BUFFER_SIZE / 2;

function createApi() {
	let isApiReady = false;
	let wasm: InitOutput | null = null;

	let NOTES = new Uint8Array(BUFFER_SIZE);
	let SAMPLES = new Float32Array(BUFFER_SIZE);
	let GATE = new Uint8Array(BUFFER_SIZE).fill(1);
	let AMPLITUDES = new Float32Array(NUM_BINS);
	let PHASES = new Float32Array(NUM_BINS);

	function relocatePointers(wasm: InitOutput) {
		NOTES = new Uint8Array(wasm.memory.buffer, getNotesPtr(), BUFFER_SIZE);
		SAMPLES = new Float32Array(wasm.memory.buffer, getSamplesPtr(), BUFFER_SIZE);
		GATE = new Uint8Array(wasm.memory.buffer, getGatePtr(), BUFFER_SIZE);
		AMPLITUDES = new Float32Array(wasm.memory.buffer, getAmplitudesPtr(), NUM_BINS);
		PHASES = new Float32Array(wasm.memory.buffer, getPhasesPtr(), NUM_BINS);
	}

	async function init() {
		if (isApiReady) return;

		const module = await fetch(wasmUrl).then((res) => res.arrayBuffer());
		wasm = initSync({ module });

		relocatePointers(wasm);

		isApiReady = true;
	}

	function ensureInit<F extends (...args: any[]) => any>(cb: F) {
		return async (...args: Parameters<F>): Promise<ReturnType<F>> => {
			await init();
			return cb(...args);
		};
	}

	const _exportMidi = ensureInit(exportMidiFile);
	const _sampleToNotes = ensureInit(samplesToNotes);
	const _countNoteInRange = ensureInit(countNoteInRange);
	const _getNthNoteInScale = ensureInit(getNthNoteInScale);

	return {
		init,
		analyze: ensureInit(analyze),
		synthesize: ensureInit(synthesize),
		isNoteInScale: ensureInit(isNoteInScale),
		getSampleNorm: ensureInit(getSampleNorm),

		getNthNoteInScale: async (note: number, noteRanges: [number, number], scale: number) => {
			return await _getNthNoteInScale(note, ...noteRanges, scale);
		},

		samplesToNotes: async (noteRanges: [number, number], scale: number) => {
			await _sampleToNotes(...noteRanges, scale);
		},
		countNoteInRange: async (noteRanges: [number, number], scale: number) =>
			_countNoteInRange(...noteRanges, scale),
		exportMidiFile: async (noteRanges: [number, number], scale: number, bpm: number) => {
			const file = await _exportMidi(...noteRanges, scale, bpm);
			relocatePointers(wasm!);

			return file;
		},

		get NOTES() {
			return NOTES;
		},
		get SAMPLES() {
			return SAMPLES;
		},
		get GATE() {
			return GATE;
		},
		get AMPLITUDES() {
			return AMPLITUDES;
		},
		get PHASES() {
			return PHASES;
		}
	};
}

export const MeloApi = createApi();
