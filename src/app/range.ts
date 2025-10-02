export function* range(start: number, end: number) {
	if (start < end) {
		for (let i = start; i < end; i++) yield i;
	} else {
		for (let i = start; i > end; i--) yield i;
	}
}

export function normalize(value: number, inMin: number, inMax: number, outMin = 0.0, outMax = 1.0) {
	if (inMax === inMin) {
		return outMin;
	}

	const scale = (outMax - outMin) / (inMax - inMin);
	return outMin + (value - inMin) * scale;
}
