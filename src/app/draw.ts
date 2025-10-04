import { BUFFER_SIZE, MeloApi } from './api';
import { isNoteBlack } from './piano';

const PIANO_WIDTH = 40;

export async function draw(
	ctx: CanvasRenderingContext2D,
	noteRanges: [number, number],
	samples: Float32Array,
	notes: Uint8Array,
	gate: Uint8Array
) {
	const width = ctx.canvas.width;
	const height = ctx.canvas.height;

	ctx.clearRect(0, 0, width, height);

	const norm = await MeloApi.getSampleNorm();
	const [noteStart, noteEnd] = noteRanges;
	const noteCount = noteEnd - noteStart;
	const blockHeight = height / noteCount;
	const blockWidth = (width - PIANO_WIDTH) / BUFFER_SIZE;

	drawPiano(ctx, noteStart, noteCount, blockHeight);
	drawGrid(ctx, noteCount, blockWidth, blockHeight);
	drawGraph(ctx, samples, norm, blockWidth);
	drawMelody(ctx, noteRanges, notes, gate, blockHeight, blockWidth);
}

function drawPiano(
	ctx: CanvasRenderingContext2D,
	noteStart: number,
	noteCount: number,
	blockHeight: number
) {
	ctx.fillStyle = '#fff';
	ctx.fillRect(0, 0, PIANO_WIDTH, ctx.canvas.height);

	ctx.fillStyle = '#000';
	ctx.beginPath();

	for (let i = 0; i < noteCount; i++) {
		const note = i + noteStart;
		if (!isNoteBlack(note)) continue;

		const y = ctx.canvas.height - (i + 1) * blockHeight;
		ctx.rect(0, y, PIANO_WIDTH, blockHeight);
	}

	ctx.fill();
}

function drawGrid(ctx: CanvasRenderingContext2D, noteCount: number, bw: number, bh: number) {
	const w = ctx.canvas.width;
	const h = ctx.canvas.height;

	// bg
	ctx.fillStyle = '#333';
	ctx.fillRect(PIANO_WIDTH, 0, w - PIANO_WIDTH, h);

	// alternating bars
	const blockCount = BUFFER_SIZE / 8;
	ctx.fillStyle = '#222';
	ctx.beginPath();
	const blockWidth = bw * 8;

	for (let i = 0; i < blockCount; i += 2) {
		ctx.rect(PIANO_WIDTH + i * blockWidth, 0, blockWidth, h);
	}
	ctx.fill();

	// grid
	ctx.lineWidth = 0.2;
	ctx.strokeStyle = '#fff';
	ctx.beginPath();

	for (let x = 0; x < BUFFER_SIZE; x++) {
		const px = PIANO_WIDTH + x * bw;
		ctx.moveTo(px, 0);
		ctx.lineTo(px, h);
	}

	for (let y = 0; y < noteCount; y++) {
		const py = y * bh;
		ctx.moveTo(PIANO_WIDTH, py);
		ctx.lineTo(w, py);
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
		const normalized = 1.0 - (samples[i] / norm / 2 + 0.5);
		const y = h - normalized * h;
		ctx.lineTo(x, y);
	}

	ctx.stroke();
}

function drawMelody(
	ctx: CanvasRenderingContext2D,
	noteRanges: [number, number],
	notes: Uint8Array,
	gate: Uint8Array,
	blockHeight: number,
	blockWidth: number
) {
	const [noteStart, noteEnd] = noteRanges;
	const h = ctx.canvas.height;

	ctx.fillStyle = 'cyan';

	let i = 0;
	while (i < BUFFER_SIZE) {
		if (gate[i] === 1) {
			const note = notes[i];

			const y = h - ((note - noteStart + 1) / (noteEnd - noteStart)) * h;

			let runLen = 1;
			while (i + runLen < BUFFER_SIZE && gate[i + runLen] === 1 && notes[i + runLen] === note) {
				runLen++;
			}

			const x = PIANO_WIDTH + i * blockWidth;
			const width = runLen * blockWidth;

			ctx.fillRect(x, y, width, blockHeight);

			i += runLen;
		} else {
			i++;
		}
	}
}
