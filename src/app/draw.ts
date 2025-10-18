import { BUFFER_SIZE, MeloApi } from './api';
import { drawGraph } from './draw/graph';
import { drawGrid } from './draw/grid';
import { drawMelody } from './draw/melody';
import { drawPiano } from './draw/piano';

export const PIANO_WIDTH = 40;

export async function draw(
	ctx: CanvasRenderingContext2D,
	noteRanges: [number, number],
	scale: number,
	samples: Float32Array,
	notes: Uint8Array,
	gate: Uint8Array,
	shouldDrawGraph = false
) {
	const width = ctx.canvas.width;
	const height = ctx.canvas.height;

	ctx.clearRect(0, 0, width, height);

	const [noteStart, noteEnd] = noteRanges;
	const scaleNotes: number[] = [];
	for (let note = noteStart; note <= noteEnd; note++) {
		if (await MeloApi.isNoteInScale(note, scale)) {
			scaleNotes.push(note);
		}
	}

	const noteCount = await MeloApi.countNoteInRange(noteRanges, scale);

	const norm = await MeloApi.getSampleNorm();
	const blockHeight = height / noteCount;
	const blockWidth = (width - PIANO_WIDTH) / BUFFER_SIZE;

	drawPiano(ctx, scaleNotes, blockHeight);
	drawGrid(ctx, noteCount, blockWidth, blockHeight);

	shouldDrawGraph && drawGraph(ctx, samples, norm, blockWidth);

	drawMelody(ctx, noteCount, notes, gate, blockHeight, blockWidth);
}
