// prettier-ignore
export const NOTE_NAMES: readonly string[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const MAJOR_PATTERN: readonly number[] = [0, 2, 4, 5, 7, 9, 11];
export const PENTATONIC_PATTERN: readonly number[] = [0, 2, 4, 7, 9];

const WHOLE_TONE: readonly number[] = [0, 2, 4, 6, 8, 10];
const HUNGARIAN_MINOR: readonly number[] = [0, 2, 3, 6, 7, 8, 11];
const DIMINISHED: readonly number[] = [0, 2, 3, 5, 6, 8, 9, 11];
const NEAPOLITAN_MAJOR: readonly number[] = [0, 1, 3, 5, 7, 9, 11];
const LYDIAN_DOMINANT: readonly number[] = [0, 2, 4, 6, 7, 9, 10];
const ENIGMATIC: readonly number[] = [0, 1, 4, 6, 8, 10, 11];

const scales: readonly [readonly number[], string][] = [
	[WHOLE_TONE, 'Whole tone'],
	[HUNGARIAN_MINOR, 'Hungarian Minor'],
	[DIMINISHED, 'Diminished'],
	[NEAPOLITAN_MAJOR, 'Neapolitan Major'],
	[LYDIAN_DOMINANT, 'Lydian Dominant'],
	[ENIGMATIC, 'Enigmatic']
];

const INTERVALS: Record<string, number> = {
	Unison: 0,
	'Minor 2nd': 1,
	'Major 2nd': 2,
	'Minor 3rd': 3,
	'Major 3rd': 4,
	'Perfect 4th': 5,
	Tritone: 6,
	'Perfect 5th': 7
};

const CHORDS: Record<string, number[]> = {
	'Major Triad': [0, 4, 7],
	'Minor Triad': [0, 3, 7],
	'Diminished Triad': [0, 3, 6],
	'Augmented Triad': [0, 4, 8],
	'Sus2 Triad': [0, 2, 7],
	'Sus4 Triad': [0, 5, 7],

	'Major 7th': [0, 4, 7, 11],
	'Minor 7th': [0, 3, 7, 10],
	'Dominant 7th': [0, 4, 7, 10],
	'Half-Diminished 7th': [0, 3, 6, 10],
	'Diminished 7th': [0, 3, 6, 9],
	'Minor Major 7th': [0, 3, 7, 11],
	'Augmented 7th': [0, 4, 8, 10],
	'Augmented Major 7th': [0, 4, 8, 11],

	'7b5': [0, 4, 6, 10],
	'7#5': [0, 4, 8, 10],
	'7b9': [0, 4, 7, 10, 1],
	'7#9': [0, 4, 7, 10, 3],

	'7#11': [0, 4, 7, 10, 6],
	'7b13': [0, 4, 7, 10, 8],
	'Maj7#11': [0, 4, 7, 11, 6],
	Minor7b5: [0, 3, 6, 10],
	'Minor7#5': [0, 3, 8, 10],
	Dominant7b5b9: [0, 4, 6, 10, 1],
	'Dominant7#5#9': [0, 4, 8, 10, 3],
	Dim7b9: [0, 3, 6, 9, 1],
	Aug7b9: [0, 4, 8, 10, 1],
	'Aug7#9': [0, 4, 8, 10, 3],
	Sus2b9: [0, 2, 7, 1],
	'Sus4#9': [0, 5, 7, 3]
};

export function generateScaleLookup(): [readonly string[], readonly number[]] {
	const lookup: Record<number, string> = {
		0b111111111111: 'Chromatic',
		0b000000000000: 'Chromatic'
	};

	const ids: number[] = [];

	for (let root = 0; root < 12; root++) {
		const relativeMinorRoot = (root + 9) % 12;
		const note = NOTE_NAMES[root];
		const noteRelative = NOTE_NAMES[relativeMinorRoot];

		const majorMask = getScale(root, MAJOR_PATTERN);
		const pentatonicMask = getScale(root, PENTATONIC_PATTERN);

		lookup[majorMask] = `${note} Major / ${noteRelative} Minor`;
		lookup[pentatonicMask] = `${note} Pentatonic`;

		ids.push(majorMask);
		ids.push(pentatonicMask);

		for (const [pattern, name] of scales) {
			const mask = getScale(root, pattern);

			lookup[mask] = `${note} ${name}`;
			ids.push(mask);
		}

		for (const chordName in CHORDS) {
			let mask = 0;
			for (const interval of CHORDS[chordName]) {
				mask |= 1 << (root + interval) % 12;
			}

			lookup[mask] = `${note} ${chordName}`;
			ids.push(mask);
		}

		for (const intervalName in INTERVALS) {
			const semitone = INTERVALS[intervalName];
			const mask = (1 << root) | (1 << (root + semitone) % 12);

			lookup[mask] = `${NOTE_NAMES[root]} ${intervalName}`;
			ids.push(mask);
		}
	}

	return [lookup as unknown as readonly string[], ids as readonly number[]];
}

export function getScale(root = 0, pattern = MAJOR_PATTERN): number {
	let mask = 0;
	for (const interval of pattern) {
		const note = (root + interval) % 12;
		mask |= 1 << note;
	}

	return mask;
}
