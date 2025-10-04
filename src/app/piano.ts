const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const COMMON_SCALES: Record<number, string> = {
	0b101011010101: 'Major',
	0b101101011010: 'Minor',
	0b100010010101: 'Pentatonic Major',
	0b100100101010: 'Pentatonic Minor'
};

export function detectScale(scaleBits: number): string {
	for (let shift = 0; shift < 12; shift++) {
		const rotated = ((scaleBits << shift) | (scaleBits >> (12 - shift))) & 0xfff;
		if (COMMON_SCALES[rotated] !== undefined) {
			return `${NOTE_NAMES[shift]} ${COMMON_SCALES[rotated]}`;
		}
	}
	return 'Unknown Scale';
}

export function isNoteBlack(midiNote: number) {
	const blackKeys = [1, 3, 6, 8, 10];
	return blackKeys.includes(midiNote % 12);
}
