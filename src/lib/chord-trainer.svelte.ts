// Chord progression ear-training game.
// One shared instance drives both the playground modal and the /chord-progression page, so a
// game in progress carries over when the modal expands to full screen.
import { synth, midiToFreq } from '$lib/synth.svelte';

export interface Degree {
	num: number; // scale degree 1–7
	roman: string;
	quality: '' | 'm' | 'dim';
	intervals: number[]; // chord tones in semitones above the key's tonic
}

// Diatonic triads of the major scale
export const DEGREES: Degree[] = [
	{ num: 1, roman: 'I', quality: '', intervals: [0, 4, 7] },
	{ num: 2, roman: 'ii', quality: 'm', intervals: [2, 5, 9] },
	{ num: 3, roman: 'iii', quality: 'm', intervals: [4, 7, 11] },
	{ num: 4, roman: 'IV', quality: '', intervals: [5, 9, 12] },
	{ num: 5, roman: 'V', quality: '', intervals: [7, 11, 14] },
	{ num: 6, roman: 'vi', quality: 'm', intervals: [9, 12, 16] },
	{ num: 7, roman: 'vii°', quality: 'dim', intervals: [11, 14, 17] }
];

// Major keys by tonic pitch class, named the way they're usually written
export const KEY_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_PCS = [0, 2, 4, 5, 7, 9, 11];

export const PROGRESSION_LENGTH = 4; // the first chord is always the tonic, the rest are guessed
export const GUESSES = PROGRESSION_LENGTH - 1;
export const MAX_LIVES = 3;
const CHORD_SECONDS = 0.95;
const CHORD_GAP_SECONDS = 0.15;
const REVEAL_MS = 1600;
export const SLOTS = Array.from({ length: PROGRESSION_LENGTH }, (_, i) => i);
export const LIFE_SLOTS = Array.from({ length: MAX_LIVES }, (_, i) => i);

// Scale degrees in the random pool; any chord can be toggled, but at least MIN_POOL stay in
const DEFAULT_POOL = [1, 2, 3, 4, 5, 6];
export const MIN_POOL = 2;

const STORAGE_KEY = 'dookfolio:chord-trainer-best';
const POOL_KEY = 'dookfolio:chord-trainer-pool';

export type Phase = 'idle' | 'round' | 'reveal' | 'over';

export interface Confetti {
	id: number;
	dx: number;
	dy: number;
	rot: number;
	delay: number;
	color: string;
	wide: boolean;
}

const CONFETTI_COLORS = ['#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#38bdf8', '#ffffff'];

const CHEATER_LINES = [
	'Cheater! 👀',
	'The duck saw that 🦆',
	'No peeking!',
	'Quack… cheater',
	'Ears, not buttons!',
	'I’m telling your teacher',
	'Bold move, cheater'
];

export function degree(num: number) {
	return DEGREES[num - 1];
}

class ChordGame {
	phase = $state<Phase>('idle');
	enabled = $state<number[]>([...DEFAULT_POOL]);
	poolWarning = $state(false);
	key = $state(0); // tonic pitch class of the current round
	progression = $state<number[]>([]); // degree numbers, progression[0] === 1
	guesses = $state<number[]>([]);
	score = $state(0);
	lives = $state(MAX_LIVES);
	lastCorrect = $state(false);
	playingIndex = $state<number | null>(null);
	isNewBest = $state(false);
	best = $state<Record<string, number>>({}); // high score per pool, keyed like "123456"
	streak = $state(0);
	celebration = $state(0); // bumps per win so the effects re-play
	confetti = $state<Confetti[]>([]);
	cheatLine = $state<string | null>(null);
	cheatCount = $state(0); // bumps on every press so the bubble re-pops
	cheatedThisRound = $state(false);

	pool = $derived(DEGREES.filter((d) => this.enabled.includes(d.num)));
	modeKey = $derived(this.pool.map((d) => d.num).join(''));
	bestScore = $derived(this.best[this.modeKey] ?? 0);
	winMessage = $derived(
		this.streak >= 10
			? `🎹 Chord wizard! x${this.streak}`
			: this.streak >= 5
				? `🔥 Unstoppable! x${this.streak}`
				: this.streak >= 3
					? `🔥 On fire! x${this.streak}`
					: this.streak === 2
						? 'Nice! 2 in a row'
						: 'Correct! +1'
	);

	private loaded = false;
	private poolWarningTimer: ReturnType<typeof setTimeout> | null = null;
	private confettiTimer: ReturnType<typeof setTimeout> | null = null;
	private cheatTimer: ReturnType<typeof setTimeout> | null = null;
	private advanceTimer: ReturnType<typeof setTimeout> | null = null;
	private timers: ReturnType<typeof setTimeout>[] = [];
	private releases: (() => void)[] = [];

	// ---- Saved high scores and chord pool ----

	// Reads storage once per page load; later mounts (modal ↔ page) reuse what's in memory
	load = () => {
		if (this.loaded) return;
		this.loaded = true;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw) as Record<string, unknown>;
				const next: Record<string, number> = {};
				for (const [k, v] of Object.entries(parsed ?? {})) {
					// Older saves used "triads" (I–vi) and "seventh" (I–vii°)
					const id = k === 'triads' ? '123456' : k === 'seventh' ? '1234567' : k;
					if (/^[1-7]+$/.test(id)) next[id] = Math.max(next[id] ?? 0, Number(v) || 0);
				}
				this.best = next;
			}
			const savedPool = JSON.parse(localStorage.getItem(POOL_KEY) ?? 'null');
			if (
				Array.isArray(savedPool) &&
				savedPool.length >= MIN_POOL &&
				savedPool.every((n) => Number.isInteger(n) && n >= 1 && n <= 7)
			) {
				this.enabled = [...new Set(savedPool as number[])].sort((a, b) => a - b);
			}
		} catch {
			// Storage can be blocked (private mode); the high score just won't persist
		}
	};

	private savePool() {
		try {
			localStorage.setItem(POOL_KEY, JSON.stringify(this.enabled));
		} catch {
			// ignore
		}
	}

	private saveBest() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.best));
		} catch {
			// ignore
		}
	}

	togglePool = (num: number) => {
		if (this.enabled.includes(num)) {
			if (this.enabled.length <= MIN_POOL) {
				this.poolWarning = true;
				if (this.poolWarningTimer) clearTimeout(this.poolWarningTimer);
				this.poolWarningTimer = setTimeout(() => (this.poolWarning = false), 1600);
				return;
			}
			this.enabled = this.enabled.filter((n) => n !== num);
		} else {
			this.enabled = [...this.enabled, num].sort((a, b) => a - b);
		}
		this.savePool();
	};

	// ---- Chord naming ----

	// Spell a scale degree's root correctly for the key: each degree gets the next letter name,
	// so E major's iii is G#m (not Abm) and F major's IV is Bb (not A#)
	private spellDegree(num: number, pc: number) {
		const letter = (LETTERS.indexOf(KEY_NAMES[this.key][0]) + num - 1) % 7;
		const offset = ((((pc - LETTER_PCS[letter]) % 12) + 18) % 12) - 6;
		return LETTERS[letter] + (offset > 0 ? '#'.repeat(offset) : 'b'.repeat(-offset));
	}

	chordName = (num: number) => {
		const d = degree(num);
		const root = this.spellDegree(num, (this.key + d.intervals[0]) % 12);
		return d.quality === 'dim' ? `${root}°` : `${root}${d.quality}`;
	};

	// ---- Audio ----

	private stopAudio() {
		for (const t of this.timers) clearTimeout(t);
		this.timers = [];
		for (const release of this.releases) release();
		this.releases = [];
		this.playingIndex = null;
	}

	// Root-position triad starting from the root in octave 4, exactly the keys you'd press on
	// the Duck Piano (e.g. D major = D4, F#4, A4)
	private chordMidi(num: number): number[] {
		const d = degree(num);
		const root = 60 + ((this.key + d.intervals[0]) % 12);
		return d.intervals.map((iv) => root + iv - d.intervals[0]);
	}

	// Same notes and tone as the piano modal: press every key of the chord, let go after `seconds`
	private playChord(num: number, seconds: number) {
		const notes = this.chordMidi(num).map((m) => synth.startNote(midiToFreq(m)));
		const stop = () => {
			for (const release of notes) release();
		};
		this.releases.push(stop);
		this.timers.push(
			setTimeout(() => {
				stop();
				this.releases = this.releases.filter((r) => r !== stop);
			}, seconds * 1000)
		);
	}

	playProgression = () => {
		this.stopAudio();
		const step = CHORD_SECONDS + CHORD_GAP_SECONDS;
		this.progression.forEach((num, i) => {
			this.timers.push(
				setTimeout(
					() => {
						this.playingIndex = i;
						this.playChord(num, CHORD_SECONDS);
					},
					i * step * 1000
				)
			);
		});
		this.timers.push(
			setTimeout(() => (this.playingIndex = null), this.progression.length * step * 1000)
		);
	};

	playSingle = (num: number) => {
		this.stopAudio();
		this.playChord(num, CHORD_SECONDS);
		this.catchCheater();
	};

	// Replay just one chord of the progression (e.g. tap the 2nd box to hear the 2nd chord alone)
	playSlot = (i: number) => {
		const num = this.progression[i];
		if (num === undefined) return;
		this.stopAudio();
		this.playingIndex = i;
		this.playChord(num, CHORD_SECONDS);
		this.timers.push(setTimeout(() => (this.playingIndex = null), CHORD_SECONDS * 1000));
	};

	// ---- Dopamine hit for a correct progression ----

	private celebrate() {
		this.celebration += 1;

		// Confetti bursts up and out from the chord boxes; a longer streak throws more of it
		const count = Math.min(24 + this.streak * 4, 60);
		this.confetti = Array.from({ length: count }, (_, i) => {
			const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
			const power = 90 + Math.random() * 130;
			return {
				id: this.celebration * 1000 + i,
				dx: Math.cos(angle) * power,
				dy: Math.sin(angle) * power,
				rot: (Math.random() - 0.5) * 720,
				delay: Math.random() * 80,
				color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
				wide: Math.random() < 0.5
			};
		});
		if (this.confettiTimer) clearTimeout(this.confettiTimer);
		this.confettiTimer = setTimeout(() => (this.confetti = []), 1300);

		this.playWinJingle();
	}

	// Quick rising arpeggio up the tonic chord, landing on the octave (same piano voice)
	private playWinJingle() {
		this.stopAudio();
		const root = 60 + this.key;
		const notes = [root, root + 4, root + 7, root + 12];
		// Each streak level nudges the jingle up a step for extra "ding"
		const lift = Math.min(this.streak - 1, 4) * 2;
		notes.forEach((m, i) => {
			this.timers.push(
				setTimeout(() => {
					const release = synth.startNote(midiToFreq(m + lift));
					const last = i === notes.length - 1;
					this.timers.push(setTimeout(() => release(last ? 0.6 : 0.12), last ? 260 : 90));
				}, i * 75)
			);
		});
	}

	// ---- Easter egg: using the Hear buttons mid-round gets you called out ----

	private catchCheater() {
		if (this.phase !== 'round') return;
		this.cheatedThisRound = true;
		this.cheatCount += 1;
		this.cheatLine =
			this.cheatCount === 1
				? CHEATER_LINES[0]
				: CHEATER_LINES[Math.floor(Math.random() * CHEATER_LINES.length)];
		if (this.cheatTimer) clearTimeout(this.cheatTimer);
		this.cheatTimer = setTimeout(() => (this.cheatLine = null), 1400);
	}

	// ---- Game flow ----

	private newRound() {
		this.cheatedThisRound = false;
		this.key = Math.floor(Math.random() * 12);
		const nums = this.pool.map((d) => d.num);
		const progression = [1];
		for (let i = 0; i < GUESSES; i++) {
			progression.push(nums[Math.floor(Math.random() * nums.length)]);
		}
		this.progression = progression;
		this.guesses = [];
		this.phase = 'round';
		this.playProgression();
	}

	startGame = () => {
		this.score = 0;
		this.streak = 0;
		this.lives = MAX_LIVES;
		this.isNewBest = false;
		this.newRound();
	};

	guess = (num: number) => {
		if (this.phase !== 'round' || this.guesses.length >= GUESSES) return;
		if (!this.pool.some((d) => d.num === num)) return;
		this.guesses = [...this.guesses, num];
		if (this.guesses.length === GUESSES) this.checkAnswer();
	};

	undo = () => {
		if (this.phase !== 'round') return;
		this.guesses = this.guesses.slice(0, -1);
	};

	private checkAnswer() {
		this.lastCorrect = this.guesses.every((g, i) => g === this.progression[i + 1]);
		if (this.lastCorrect) {
			this.score += 1;
			this.streak += 1;
			this.celebrate();
			if (this.score > (this.best[this.modeKey] ?? 0)) {
				this.best = { ...this.best, [this.modeKey]: this.score };
				this.isNewBest = true;
				this.saveBest();
			}
		} else {
			this.lives -= 1;
			this.streak = 0;
		}
		this.phase = 'reveal';
		// Kept apart from the audio timers so replaying a chord during the reveal can't cancel it
		this.clearAdvance();
		this.advanceTimer = setTimeout(
			() => {
				this.advanceTimer = null;
				if (this.lives <= 0) {
					this.stopAudio();
					this.phase = 'over';
				} else {
					this.newRound();
				}
			},
			REVEAL_MS + (this.lastCorrect ? 0 : 900)
		);
	}

	private clearAdvance() {
		if (this.advanceTimer) clearTimeout(this.advanceTimer);
		this.advanceTimer = null;
	}

	slotState = (i: number): 'empty' | 'filled' | 'right' | 'wrong' => {
		const g = this.guesses[i];
		if (g === undefined) return 'empty';
		if (this.phase !== 'reveal') return 'filled';
		return g === this.progression[i + 1] ? 'right' : 'wrong';
	};

	// Stop the music and go back to the start screen
	reset = () => {
		this.clearAdvance();
		this.stopAudio();
		if (this.cheatTimer) clearTimeout(this.cheatTimer);
		this.cheatLine = null;
		this.cheatCount = 0;
		if (this.confettiTimer) clearTimeout(this.confettiTimer);
		this.confetti = [];
		this.streak = 0;
		this.phase = 'idle';
		this.guesses = [];
		this.progression = [];
	};
}

export const chordGame = new ChordGame();
