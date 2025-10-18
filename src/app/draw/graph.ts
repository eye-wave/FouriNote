import { BUFFER_SIZE, MeloApi } from '../api';
import { PIANO_WIDTH } from '../draw';

export function drawGraph(
	ctx: CanvasRenderingContext2D,
	samples: Float32Array,
	norm: number,
	blockWidth: number
) {
	ctx.strokeStyle = 'magenta';
	ctx.lineWidth = 3;
	ctx.lineJoin = 'round';
	ctx.lineCap = 'round';
	ctx.beginPath();

	const h = ctx.canvas.height;

	for (let i = 1; i < BUFFER_SIZE; i++) {
		const x = PIANO_WIDTH + i * blockWidth;
		const normalized = 1.0 - (samples[i] / norm / 2 + 0.5);
		const y = h - normalized * h;
		ctx.lineTo(x, y);
	}

	ctx.stroke();
}
