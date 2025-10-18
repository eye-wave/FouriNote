import { generateScaleLookup } from './piano/scales' with { type: 'macro' };
import { MAJOR_PATTERN, PENTATONIC_PATTERN, getScale } from './piano/scales';

export { NOTE_NAMES } from './piano/scales';

const [COMMON_SCALES, SCALE_IDS] = generateScaleLookup();
const BLACK_KEYS: readonly number[] = [1, 3, 6, 8, 10];

export const getMajorScale = (root: number) => getScale(root, MAJOR_PATTERN);
export const getPentatonicScale = (root: number) => getScale(root, PENTATONIC_PATTERN);

export function getRandomScale() {
	const i = (Math.random() * SCALE_IDS.length) | 0;
	return SCALE_IDS[i];
}

export function getRandomNotes() {
	return (Math.random() * 4095) | 0;
}

export function detectScale(mask: number): string {
	return COMMON_SCALES[mask] ?? 'Unknown scale';
}

export function isNoteBlack(midiNote: number) {
	return BLACK_KEYS.includes(midiNote % 12);
}

export function midiToNote(midi: number): string {
	const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
	const octave = Math.floor(midi / 12) - 1;
	const note = notes[midi % 12];
	return `${note}${octave}`;
}
