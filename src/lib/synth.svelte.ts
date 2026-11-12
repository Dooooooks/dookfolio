// 8-Bit Synthesizer Sound Engine using Web Audio API
// Synthesizes retro 8-bit sound effects for UI interactions in Game Dev Mode

export interface SynthState {
	muted: boolean;
}

export const synthState = $state<SynthState>({
	muted: true // Muted by default for UX design & autoplay compliance
});

// Volume (0–1) for the playable instruments (Duck Piano, chord trainer); UI sounds aren't affected
const VOLUME_KEY = 'dookfolio:instrument-volume';
export const instrumentVolume = $state({ value: 1 });

function loadInstrumentVolume() {
	try {
		const saved = Number(localStorage.getItem(VOLUME_KEY));
		if (localStorage.getItem(VOLUME_KEY) !== null && saved >= 0 && saved <= 1) {
			instrumentVolume.value = saved;
		}
	} catch {
		// Storage can be blocked (private mode); the volume just won't persist
	}
}
if (typeof window !== 'undefined') loadInstrumentVolume();

// Perceived loudness is roughly logarithmic, so a squared curve makes the slider feel even
const volumeToGain = (volume: number) => volume * volume;

// Note frequencies (Hz) for retro arpeggios
const NOTE = {
	A3: 220.0,
	C4: 261.63,
	E4: 329.63,
	G4: 392.0,
	A4: 440.0,
	B4: 493.88,
	C5: 523.25,
	D5: 587.33,
	E5: 659.25,
	G5: 783.99,
	A5: 880.0,
	C6: 1046.5
};

class ChiptuneSoundEngine {
	private ctx: AudioContext | null = null;
	private masterGain: GainNode | null = null;
	private filter: BiquadFilterNode | null = null;
	private instrumentGain: GainNode | null = null;

	private initContext(): boolean {
		if (typeof window === 'undefined') return false;

		if (!this.ctx) {
			const AudioContextClass =
				window.AudioContext ||
				(window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
			if (!AudioContextClass) return false;

			this.ctx = new AudioContextClass();

			// Low-pass filter for vintage 8-bit console DAC feel (warm, avoids harsh high tones)
			this.filter = this.ctx.createBiquadFilter();
			this.filter.type = 'lowpass';
			this.filter.frequency.setValueAtTime(3600, this.ctx.currentTime);
			this.filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

			// Master gain for overall UI sound balance
			this.masterGain = this.ctx.createGain();
			this.masterGain.gain.setValueAtTime(0.2, this.ctx.currentTime);

			this.filter.connect(this.masterGain);
			this.masterGain.connect(this.ctx.destination);

			// Instrument notes pass through their own volume stage before the shared filter
			this.instrumentGain = this.ctx.createGain();
			this.instrumentGain.gain.setValueAtTime(
				volumeToGain(instrumentVolume.value),
				this.ctx.currentTime
			);
			this.instrumentGain.connect(this.filter);
		}

		if (this.ctx.state === 'suspended') {
			this.ctx.resume().catch(() => {});
		}

		return true;
	}

	private canPlay(): boolean {
		return !synthState.muted;
	}

	// Crisp 8-bit retro UI button click
	playUiClick() {
		if (!this.canPlay()) return;
		if (!this.initContext() || !this.ctx || !this.filter) return;

		const now = this.ctx.currentTime;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();

		osc.type = 'square';
		osc.frequency.setValueAtTime(680, now);
		osc.frequency.exponentialRampToValueAtTime(460, now + 0.035);

		gain.gain.setValueAtTime(0.065, now);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

		osc.connect(gain);
		gain.connect(this.filter);

		osc.start(now);
		osc.stop(now + 0.035);
	}

	// Classic retro synth quack / blip
	playQuack(isCrit = false) {
		if (!this.canPlay()) return;
		if (!this.initContext() || !this.ctx || !this.filter) return;

		const now = this.ctx.currentTime;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();

		osc.type = 'square';
		if (isCrit) {
			// Energetic high pitch-bent crit sound
			osc.frequency.setValueAtTime(880, now);
			osc.frequency.exponentialRampToValueAtTime(1174, now + 0.04);
			osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);

			gain.gain.setValueAtTime(0.12, now);
			gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

			osc.connect(gain);
			gain.connect(this.filter);
			osc.start(now);
			osc.stop(now + 0.16);
		} else {
			// Classic pitch-sliding synth quack
			osc.frequency.setValueAtTime(540, now);
			osc.frequency.exponentialRampToValueAtTime(260, now + 0.11);

			gain.gain.setValueAtTime(0.09, now);
			gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

			osc.connect(gain);
			gain.connect(this.filter);
			osc.start(now);
			osc.stop(now + 0.12);
		}
	}

	// 8-bit Rising upgrade fanfare chime (C5 -> E5 -> G5 -> C6)
	playUpgrade() {
		if (!this.canPlay()) return;
		if (!this.initContext() || !this.ctx || !this.filter) return;

		const now = this.ctx.currentTime;
		const notes = [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6];
		const noteTime = 0.045;

		notes.forEach((freq, idx) => {
			if (!this.ctx || !this.filter) return;
			const t = now + idx * noteTime;
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();

			osc.type = 'square';
			osc.frequency.setValueAtTime(freq, t);

			gain.gain.setValueAtTime(0.09, t);
			gain.gain.exponentialRampToValueAtTime(0.0001, t + noteTime);

			osc.connect(gain);
			gain.connect(this.filter);

			osc.start(t);
			osc.stop(t + noteTime);
		});
	}

	// 8-bit Crumb munch / feed sound
	playFeed() {
		if (!this.canPlay()) return;
		if (!this.initContext() || !this.ctx || !this.filter) return;

		const now = this.ctx.currentTime;
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();

		osc.type = 'square';
		osc.frequency.setValueAtTime(320, now);
		osc.frequency.exponentialRampToValueAtTime(640, now + 0.09);

		gain.gain.setValueAtTime(0.08, now);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

		osc.connect(gain);
		gain.connect(this.filter);
		osc.start(now);
		osc.stop(now + 0.1);
	}

	// 8-bit Modal opening chime
	playModalOpen() {
		if (!this.canPlay()) return;
		if (!this.initContext() || !this.ctx || !this.filter) return;

		const now = this.ctx.currentTime;
		const notes = [NOTE.C5, NOTE.G5];
		const noteTime = 0.04;

		notes.forEach((freq, idx) => {
			if (!this.ctx || !this.filter) return;
			const t = now + idx * noteTime;
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();

			osc.type = 'square';
			osc.frequency.setValueAtTime(freq, t);

			gain.gain.setValueAtTime(0.065, t);
			gain.gain.exponentialRampToValueAtTime(0.0001, t + noteTime);

			osc.connect(gain);
			gain.connect(this.filter);

			osc.start(t);
			osc.stop(t + noteTime);
		});
	}

	// 8-bit Modal closing chime
	playModalClose() {
		if (!this.canPlay()) return;
		if (!this.initContext() || !this.ctx || !this.filter) return;

		const now = this.ctx.currentTime;
		const notes = [NOTE.G5, NOTE.C5];
		const noteTime = 0.035;

		notes.forEach((freq, idx) => {
			if (!this.ctx || !this.filter) return;
			const t = now + idx * noteTime;
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();

			osc.type = 'square';
			osc.frequency.setValueAtTime(freq, t);

			gain.gain.setValueAtTime(0.055, t);
			gain.gain.exponentialRampToValueAtTime(0.0001, t + noteTime);

			osc.connect(gain);
			gain.connect(this.filter);

			osc.start(t);
			osc.stop(t + noteTime);
		});
	}

	// Sustained 8-bit piano note; returns a release function. Ignores mute (piano is opt-in)
	// The release function takes how long (seconds) the note fades out, e.g. longer with sustain on
	startNote(freq: number): (fadeSeconds?: number) => void {
		if (!this.initContext() || !this.ctx || !this.instrumentGain) return () => {};

		const ctx = this.ctx;
		const now = ctx.currentTime;
		const gain = ctx.createGain();

		// Soft triangle body with a quiet square an octave up for chiptune bite
		const body = ctx.createOscillator();
		body.type = 'triangle';
		body.frequency.setValueAtTime(freq, now);

		const bite = ctx.createOscillator();
		const biteGain = ctx.createGain();
		bite.type = 'square';
		bite.frequency.setValueAtTime(freq * 2, now);
		biteGain.gain.setValueAtTime(0.15, now);

		// Attack -> decay -> sustain envelope
		gain.gain.setValueAtTime(0.0001, now);
		gain.gain.exponentialRampToValueAtTime(0.4, now + 0.005);
		gain.gain.exponentialRampToValueAtTime(0.2, now + 0.25);

		body.connect(gain);
		bite.connect(biteGain);
		biteGain.connect(gain);
		gain.connect(this.instrumentGain);

		body.start(now);
		bite.start(now);

		let released = false;
		return (fadeSeconds = 0.15) => {
			if (released) return;
			released = true;
			const t = ctx.currentTime;
			gain.gain.cancelScheduledValues(t);
			gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), t);
			gain.gain.exponentialRampToValueAtTime(0.0001, t + fadeSeconds);
			body.stop(t + fadeSeconds + 0.01);
			bite.stop(t + fadeSeconds + 0.01);
		};
	}

	// Glide (rather than jump) to the new volume so dragging the slider doesn't click
	setInstrumentVolume(volume: number) {
		const value = Math.min(1, Math.max(0, volume));
		instrumentVolume.value = value;
		try {
			localStorage.setItem(VOLUME_KEY, String(value));
		} catch {
			// ignore
		}
		if (this.ctx && this.instrumentGain) {
			this.instrumentGain.gain.setTargetAtTime(volumeToGain(value), this.ctx.currentTime, 0.02);
		}
	}

	// 8-bit Power down / break contract sound
	playPowerDown() {
		if (!this.canPlay()) return;
		if (!this.initContext() || !this.ctx || !this.filter) return;

		const now = this.ctx.currentTime;
		const notes = [NOTE.E5, NOTE.C5, NOTE.G4, NOTE.C4];
		const noteTime = 0.05;

		notes.forEach((freq, idx) => {
			if (!this.ctx || !this.filter) return;
			const t = now + idx * noteTime;
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();

			osc.type = 'square';
			osc.frequency.setValueAtTime(freq, t);

			gain.gain.setValueAtTime(0.07, t);
			gain.gain.exponentialRampToValueAtTime(0.0001, t + noteTime);

			osc.connect(gain);
			gain.connect(this.filter);

			osc.start(t);
			osc.stop(t + noteTime);
		});
	}
}

export const synth = new ChiptuneSoundEngine();

export function midiToFreq(note: number): number {
	return 440 * 2 ** ((note - 69) / 12);
}

export function toggleAudioMute() {
	if (synthState.muted) {
		synthState.muted = false;
		// Play quick confirmation blip when unmuting
		synth.playUiClick();
	} else {
		synthState.muted = true;
	}
}

export function muteAudio() {
	synthState.muted = true;
}
