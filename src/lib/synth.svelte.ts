// 8-Bit Synthesizer Sound Engine using Web Audio API
// Synthesizes retro 8-bit sound effects for UI interactions in Game Dev Mode

import { gameDevMode } from './game-mode.svelte';

export interface SynthState {
	muted: boolean;
}

export const synthState = $state<SynthState>({
	muted: true // Muted by default for UX design & autoplay compliance
});

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
		}

		if (this.ctx.state === 'suspended') {
			this.ctx.resume().catch(() => {});
		}

		return true;
	}

	private canPlay(): boolean {
		return !synthState.muted && gameDevMode.active;
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
