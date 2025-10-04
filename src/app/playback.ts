import { BUFFER_SIZE } from './api';

function createTimer(callback: () => void, timeInterval: number) {
	let timeoutId = -1;
	let expected = 0;

	function start() {
		expected = Date.now() + timeInterval;
		timeoutId = window.setTimeout(tick, timeInterval);
	}

	function stop() {
		if (timeoutId < 0) return;
		clearTimeout(timeoutId);
		timeoutId = -1;
	}

	function tick() {
		let drift = Date.now() - expected;

		callback();

		expected += timeInterval;
		timeoutId = window.setTimeout(tick, timeInterval - drift);
	}

	return {
		start,
		stop
	};
}

function midiToFreq(note: number) {
	return 440 * Math.pow(2, (note - 69) / 12);
}

function playSine(audioCtx: AudioContext, note: number, duration: number) {
	const osc = audioCtx.createOscillator();
	const gain = audioCtx.createGain();

	osc.type = 'sine';
	osc.frequency.value = midiToFreq(note);
	gain.gain.setValueAtTime(0.2, audioCtx.currentTime);

	osc.connect(gain);
	gain.connect(audioCtx.destination);

	osc.start();
	osc.stop(audioCtx.currentTime + duration);

	osc.onended = () => {
		osc.disconnect();
		gain.disconnect();
	};
}

export function createAudioSequencer(notes: Uint8Array, gate: Uint8Array, bpm: number) {
	const steps = BUFFER_SIZE;
	const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

	const stepsPerBeat = 4;
	const stepInterval = 60000 / bpm / stepsPerBeat;

	let currentStep = 0;
	let remainingHoldSteps = 0;

	function tick() {
		if (currentStep >= steps) {
			timer.stop();
			return;
		}

		if (remainingHoldSteps > 0) {
			remainingHoldSteps--;
			currentStep++;
			return;
		}

		if (gate[currentStep] === 1) {
			const note = notes[currentStep];

			let runLength = 1;
			while (
				currentStep + runLength < steps &&
				notes[currentStep + runLength] === note &&
				gate[currentStep + runLength] === 1
			)
				runLength++;

			playSine(audioCtx, note, (runLength * stepInterval) / 1000);

			remainingHoldSteps = runLength - 1;
		}

		currentStep++;
	}

	const timer = createTimer(tick, stepInterval);

	return {
		start: () => timer.start(),
		stop: () => timer.stop(),
		reset: () => {
			currentStep = 0;
			remainingHoldSteps = 0;
		}
	};
}
