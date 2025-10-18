import { BUFFER_SIZE, MeloApi } from '../api';
import { PIANO_WIDTH } from '../draw';

export function drawMelody(
	ctx: CanvasRenderingContext2D,
	noteCount: number,
	notes: Uint8Array,
	gate: Uint8Array,
	blockHeight: number,
	blockWidth: number
) {
	const h = ctx.canvas.height;

	ctx.fillStyle = 'cyan';

	let i = 0;
	while (i < BUFFER_SIZE) {
		if (gate[i] === 1) {
			const note = notes[i];

			const y = h - ((note + 1) / noteCount) * h;

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
