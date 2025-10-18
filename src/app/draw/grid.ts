import { BUFFER_SIZE } from '../api';
import { PIANO_WIDTH } from '../draw';

export function drawGrid(ctx: CanvasRenderingContext2D, noteCount: number, bw: number, bh: number) {
	const w = ctx.canvas.width;
	const h = ctx.canvas.height;

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
	ctx.strokeStyle = 'white';
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
