import { BUFFER_SIZE } from './App.svelte';

const PIANO_WIDTH = 40;

export function draw(
	ctx: CanvasRenderingContext2D,
	noteRanges: [number, number],
	samples: Float32Array,
	gate: Uint8Array
) {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	const __norm = samples.reduce((max, s) => Math.max(max, Math.abs(s)), 1);
	const norm = __norm > 1 ? __norm : 1.0;

	const noteRange = noteRanges[1] - noteRanges[0];
	const blockHeight = ctx.canvas.height / noteRange;
	const blockWidth = (ctx.canvas.width - PIANO_WIDTH) / BUFFER_SIZE;

	drawPiano(ctx, noteRange, noteRanges[0], blockHeight);
	drawGrid(ctx, noteRange, blockWidth, blockHeight);

	drawGraph(ctx, samples, norm, blockWidth);
	drawMelody(ctx, noteRange, samples, norm, gate, blockHeight);
}

function isNoteBlack(midiNote: number) {
	const BLACK_MASK = 0b010010101010;
	return ((BLACK_MASK >> midiNote % 12) & 1) !== 0;
}

function drawPiano(
	ctx: CanvasRenderingContext2D,
	noteRange: number,
	noteStart: number,
	blockHeigt: number
) {
	ctx.fillStyle = '#fff';
	ctx.fillRect(0, 0, PIANO_WIDTH, ctx.canvas.height);

	ctx.fillStyle = '#000';
	ctx.beginPath();

	for (let i = 0; i < noteRange; i++) {
		const note = i + noteStart;
		const isBlack = isNoteBlack(note);

		if (!isBlack) continue;

		const y = ctx.canvas.height - (i + 1) * blockHeigt;
		ctx.rect(0, y, PIANO_WIDTH, blockHeigt);
	}

	ctx.fill();
}

function drawGrid(ctx: CanvasRenderingContext2D, noteRange: number, bw: number, bh: number) {
	const h = ctx.canvas.height;
	const w = ctx.canvas.width;

	ctx.fillStyle = '#333';
	ctx.fillRect(PIANO_WIDTH, 0, w - PIANO_WIDTH, h);

	const blockCount = BUFFER_SIZE / 8;

	ctx.fillStyle = '#222';
	ctx.beginPath();

	const blockWidth = bw * 8;

	for (let i = 0; i < blockCount; i += 2) {
		ctx.rect(PIANO_WIDTH + i * blockWidth, 0, blockWidth, h);
	}

	ctx.fill();

	ctx.lineWidth = 0.2;
	ctx.strokeStyle = '#fff';
	ctx.beginPath();

	for (let x = 0; x < BUFFER_SIZE; x++) {
		ctx.moveTo(PIANO_WIDTH + x * bw, 0);
		ctx.lineTo(PIANO_WIDTH + x * bw, h);
	}

	for (let y = 0; y < noteRange; y++) {
		ctx.moveTo(PIANO_WIDTH, y * bh);
		ctx.lineTo(w, y * bh);
	}

	ctx.stroke();
}

function drawGraph(
	ctx: CanvasRenderingContext2D,
	samples: Float32Array,
	norm: number,
	blockWidth: number
) {
	ctx.strokeStyle = '#00de9f';
	ctx.lineWidth = 2;
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';

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
	gate: Uint8Array,
	blockSize: number
) {
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
