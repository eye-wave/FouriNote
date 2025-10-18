import { PIANO_WIDTH } from '../draw';
import { isNoteBlack, midiToNote } from '../piano';

export function drawPiano(
	ctx: CanvasRenderingContext2D,
	scaleNotes: number[],
	blockHeight: number
) {
	ctx.fillStyle = 'white';
	ctx.fillRect(0, 0, PIANO_WIDTH, ctx.canvas.height);

	ctx.fillStyle = 'black';
	ctx.beginPath();

	for (let i = 0; i < scaleNotes.length; i++) {
		const note = scaleNotes[i];
		if (!isNoteBlack(note)) continue;

		const y = ctx.canvas.height - (i + 1) * blockHeight;
		ctx.rect(0, y, PIANO_WIDTH, blockHeight);
	}

	ctx.fill();

	const fontSize = Math.min(Math.max(Math.floor(blockHeight * 0.8), 8), 18);

	ctx.font = `${fontSize}px sans-serif`;
	ctx.textAlign = 'right';
	ctx.textBaseline = 'middle';

	for (let i = 0; i < scaleNotes.length; i++) {
		const note = scaleNotes[i];
		const y = ctx.canvas.height - (i + 0.5) * blockHeight;
		const noteName = midiToNote(note);

		if (isNoteBlack(note)) ctx.fillStyle = 'cyan';
		else ctx.fillStyle = 'red';

		ctx.fillText(noteName, PIANO_WIDTH - 2, y);
	}
}
