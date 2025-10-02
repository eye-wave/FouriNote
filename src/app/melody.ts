import { BUFFER_SIZE } from './App.svelte';

export function draw(
	ctx: CanvasRenderingContext2D,
	noteRange: [number, number],
	samples: Float32Array,
	gate: Uint8Array
) {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	const __norm = samples.reduce((max, s) => Math.max(max, Math.abs(s)), 1);
	const norm = __norm > 1 ? __norm : 1.0;

	drawPiano(ctx, noteRange);
	drawGraph(ctx, samples, norm);
	drawMelody(ctx, noteRange[1] - noteRange[0], samples, norm, gate);
}

const PIANO_WIDTH = 40;

function isNoteBlack(midiNote: number) {
	const BLACK_MASK = 0b010010101010;
	return ((BLACK_MASK >> midiNote % 12) & 1) !== 0;
}

function drawPiano(ctx: CanvasRenderingContext2D, noteRanges: [number, number]) {
	const noteRange = noteRanges[1] - noteRanges[0];
	const blockSize = ctx.canvas.height / noteRange;

	for (let i = 0; i < noteRange; i++) {
		const note = i + noteRanges[0];
		const isBlack = isNoteBlack(note);

		ctx.fillStyle = isBlack ? '#000' : '#fff';
		ctx.beginPath();
		ctx.fillRect(0, i * blockSize, PIANO_WIDTH, blockSize);
	}
}

function drawGraph(ctx: CanvasRenderingContext2D, samples: Float32Array, norm: number) {
	const blockWidth = (ctx.canvas.width - PIANO_WIDTH) / BUFFER_SIZE;

	ctx.strokeStyle = 'red';
	ctx.beginPath();

	const h = ctx.canvas.height;

	for (let i = 0; i < BUFFER_SIZE; i++) {
		const x = PIANO_WIDTH + i * blockWidth;
		const normalized = 1.0 - (samples[i] / norm / 2.0 + 0.5);
		const y = normalized * h;

		ctx.lineTo(x, y);
	}

	ctx.stroke();
}

function sampleToNote(samples: Float32Array, i: number, noteRange: number, norm: number) {
	const normalized = 1.0 - (samples[i] / norm / 2.0 + 0.5);
	const note = Math.floor(normalized * noteRange) / noteRange;

	return note;
}

function drawMelody(
	ctx: CanvasRenderingContext2D,
	noteRange: number,
	samples: Float32Array,
	norm: number,
	gate: Uint8Array
) {
	const blockSize = ctx.canvas.height / noteRange;
	const w = ctx.canvas.width - PIANO_WIDTH;
	const h = ctx.canvas.height;
	const sampleWidth = w / BUFFER_SIZE;

	ctx.fillStyle = 'cyan';

	let i = 0;
	while (i < BUFFER_SIZE) {
		if (gate[i] === 1) {
			const note = sampleToNote(samples, i, noteRange, norm);
			const y = note * h;

			let runLen = 1;
			while (i + runLen < BUFFER_SIZE && gate[i + runLen] === 1) {
				let nextNote = sampleToNote(samples, i + runLen, noteRange, norm);
				if (nextNote !== note) break;
				runLen += 1;
			}

			const x = PIANO_WIDTH + i * sampleWidth;
			const width = runLen * sampleWidth;

			ctx.fillRect(x, y, width, blockSize);

			i += runLen;
		} else {
			i += 1;
		}
	}
}
