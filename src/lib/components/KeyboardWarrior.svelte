<script lang="ts">
	import { onMount } from 'svelte';
	import { Heart, House, Play, RotateCcw } from '@lucide/svelte';
	import { gameDevMode } from '$lib/game-mode.svelte';
	import { synth } from '$lib/synth.svelte';
	import { TYPING_WORDS } from '$lib/data/typing-words';

	// onexit: Escape on the main menu asks the modal to close
	let { active = true, onexit }: { active?: boolean; onexit?: () => void } = $props();

	// --- Tuning ---
	const MAX_LIVES = 3;
	const SPRITE_FRAME = 32;
	const SPRITE_SCALE = 3;
	const DUCK_RADIUS = 22;
	const INVULNERABLE_SECONDS = 1;
	// Taking a hit wipes every meteor off the screen, winds the speed-up back by this fraction and
	// holds off new meteors for a moment, so a mistake gives you room to recover
	const HIT_SLOWDOWN = 0.25;
	const HIT_COOLDOWN = 2.5;
	const SHOCKWAVE_SECONDS = 0.6;
	const BULLET_SPEED = 1600;
	const ACCENT = '#b694ff';
	const BEST_KEY = 'dookfolio:keyboard-warrior-best';
	const DIFFICULTY_KEY = 'dookfolio:keyboard-warrior-difficulty';

	// --- Difficulty ---
	// Each curve is [starting value, decay per second, floor]. Meteors keep arriving faster and
	// sooner until they hit the floor, which is far beyond anyone's typing speed, so every run ends.
	// Roughly the WPM needed to keep up: Easy ~40 at 1 min and ~80 at 2 min; Normal ~65 at 1 min
	// and ~110 at 1:30; Hard ~120 at 1 min
	type Difficulty = 'easy' | 'normal' | 'hard';
	interface DifficultyConfig {
		label: string;
		blurb: string;
		travel: [number, number, number]; // seconds for a meteor to reach the duck
		spawn: [number, number, number]; // seconds between meteors
		lengthEvery: number; // seconds per extra letter in the longest words
	}
	const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
		easy: {
			label: 'Easy',
			blurb: 'A slow, gentle ramp. Good for warming up.',
			travel: [17, 0.99, 2.6],
			spawn: [3.4, 0.99, 0.5],
			lengthEvery: 22
		},
		normal: {
			label: 'Normal',
			blurb: 'Steady pressure that builds over a few minutes.',
			travel: [15, 0.986, 1.8],
			spawn: [2.8, 0.985, 0.35],
			lengthEvery: 15
		},
		hard: {
			label: 'Hard',
			blurb: 'Fast from the start and it ramps up quickly.',
			travel: [12, 0.978, 1.2],
			spawn: [2.4, 0.978, 0.25],
			lengthEvery: 10
		}
	};
	const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'normal', 'hard'];

	const curve = ([start, decay, floor]: [number, number, number], t: number) =>
		Math.max(floor, start * decay ** t);
	// Seconds a meteor takes to reach the duck
	const travelTime = (t: number) => curve(DIFFICULTIES[difficulty].travel, t);
	// Seconds between meteors
	const spawnInterval = (t: number) => curve(DIFFICULTIES[difficulty].spawn, t);
	// Longer words show up as the run goes on
	const wordLengths = (t: number) => {
		const every = DIFFICULTIES[difficulty].lengthEvery;
		return { min: t < every * 2 ? 2 : 3, max: Math.min(12, 4 + Math.floor(t / every)) };
	};

	// --- Types ---
	interface Meteor {
		x: number;
		y: number;
		word: string;
		typed: number;
		r: number;
		verts: number[]; // radius factor per vertex
		angle: number;
		spin: number;
		pace: number; // per-meteor speed variation
		distance: number; // starting distance, so every direction takes the same time to arrive
		aimX: number; // small offset from the duck so they don't all converge on one pixel
		aimY: number;
		flash: number;
	}

	interface Particle {
		x: number;
		y: number;
		vx: number;
		vy: number;
		life: number;
		maxLife: number;
		len: number;
		rot: number;
		vr: number;
		color: string;
	}

	interface Bullet {
		x: number;
		y: number;
		tx: number;
		ty: number;
	}

	interface Star {
		x: number;
		y: number;
		z: number;
	}

	type Phase = 'menu' | 'playing' | 'paused' | 'countdown' | 'over';
	interface Best {
		wpm: number;
		seconds: number;
	}

	// --- HUD state (reactive) ---
	let phase = $state<Phase>('menu');
	// Seconds left before play resumes after a pause
	const RESUME_COUNTDOWN = 3;
	let countdown = 0;
	let countdownShown = $state(RESUME_COUNTDOWN);
	let difficulty = $state<Difficulty>('normal');
	// Mirrors whether a key is held, for the menu's duck (the canvas duck reads heldKeys directly)
	let typingPose = $state(false);
	let lives = $state(MAX_LIVES);
	let wpm = $state(0);
	let clock = $state(0); // elapsed seconds shown in the HUD
	let result = $state({ wpm: 0, accuracy: 100, words: 0, seconds: 0, newBest: false });
	let bests = $state<Record<Difficulty, Best>>({
		easy: { wpm: 0, seconds: 0 },
		normal: { wpm: 0, seconds: 0 },
		hard: { wpm: 0, seconds: 0 }
	});

	// --- Game state (plain, mutated every frame) ---
	let canvas: HTMLCanvasElement | undefined = $state();
	let wrapper: HTMLDivElement | undefined = $state();
	let ctx: CanvasRenderingContext2D | null = null;
	let width = 0;
	let height = 0;
	let dpr = 1;

	let meteors: Meteor[] = [];
	let particles: Particle[] = [];
	let bullets: Bullet[] = [];
	let stars: Star[] = [];
	let target: Meteor | null = null;

	let elapsed = 0;
	// Drives the speed-up; it runs with the clock but is wound back when the duck gets hit
	let rampTime = 0;
	let shockwave = -1; // seconds since the last hit's shockwave started, -1 when there isn't one
	let spawnTimer = 0;
	let wpmTimer = 0;
	let invulnerable = 0;
	let shake = 0;
	let facing = -1; // the sprite faces left; 1 flips it to face right
	let correctChars = 0;
	let wordsDestroyed = 0;
	let keystrokes = 0;
	let correctKeystrokes = 0;
	let overAt = 0;

	// Read only by the canvas loop, so it doesn't need to be reactive
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const heldKeys = new Set<string>();
	let sprite: HTMLImageElement | null = null;
	let rafId = 0;
	let lastTime = 0;
	let reducedMotion = false;

	const font = () =>
		gameDevMode.active
			? '10px "Press Start 2P", monospace'
			: '700 17px "Nunito Variable", sans-serif';

	// --- Setup ---
	function resize() {
		if (!canvas || !wrapper) return;
		const rect = wrapper.getBoundingClientRect();
		width = rect.width;
		height = rect.height;
		dpr = Math.min(2, window.devicePixelRatio || 1);
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);
		ctx = canvas.getContext('2d');
		if (!running()) draw();
	}

	function makeStars() {
		stars = Array.from({ length: 140 }, () => ({
			x: Math.random(),
			y: Math.random(),
			z: 0.2 + Math.random() * 0.8
		}));
	}

	function loadSaved() {
		try {
			const saved = JSON.parse(localStorage.getItem(BEST_KEY) ?? 'null');
			for (const d of DIFFICULTY_ORDER) {
				if (typeof saved?.[d]?.wpm === 'number') {
					bests[d] = { wpm: saved[d].wpm, seconds: saved[d].seconds ?? 0 };
				}
			}
			const savedDifficulty = localStorage.getItem(DIFFICULTY_KEY);
			if (DIFFICULTY_ORDER.includes(savedDifficulty as Difficulty)) {
				difficulty = savedDifficulty as Difficulty;
			}
		} catch {
			// Storage can be blocked; scores and the chosen difficulty just won't persist
		}
	}

	function save(key: string, value: string) {
		try {
			localStorage.setItem(key, value);
		} catch {
			// ignore
		}
	}

	function chooseDifficulty(d: Difficulty) {
		if (d === difficulty) return;
		difficulty = d;
		save(DIFFICULTY_KEY, d);
		synth.playGameSfx('shot');
	}

	// --- Game flow ---
	function clearField() {
		meteors = [];
		bullets = [];
		target = null;
	}

	function toMenu() {
		clearField();
		particles = [];
		lives = MAX_LIVES;
		wpm = 0;
		phase = 'menu';
		wake();
	}

	function startGame() {
		meteors = [];
		particles = [];
		bullets = [];
		target = null;
		elapsed = 0;
		rampTime = 0;
		shockwave = -1;
		spawnTimer = 0.6;
		wpmTimer = 0;
		invulnerable = 0;
		shake = 0;
		correctChars = 0;
		wordsDestroyed = 0;
		keystrokes = 0;
		correctKeystrokes = 0;
		lives = MAX_LIVES;
		wpm = 0;
		clock = 0;
		phase = 'playing';
		wake();
	}

	function computeWpm() {
		// monkeytype: every 5 correct characters (spaces between words included) is one word
		const minutes = Math.max(elapsed, 2) / 60;
		return Math.round(correctChars / 5 / minutes);
	}

	function endGame() {
		const finalWpm = computeWpm();
		const accuracy = keystrokes ? Math.round((correctKeystrokes / keystrokes) * 100) : 100;
		const best = bests[difficulty];
		const newBest = finalWpm > best.wpm;
		if (newBest || elapsed > best.seconds) {
			bests[difficulty] = {
				wpm: Math.max(best.wpm, finalWpm),
				seconds: Math.max(best.seconds, elapsed)
			};
			save(BEST_KEY, JSON.stringify(bests));
		}
		result = { wpm: finalWpm, accuracy, words: wordsDestroyed, seconds: elapsed, newBest };
		wpm = finalWpm;
		for (const m of meteors) burst(m, 'rgba(200, 200, 215, 0.8)');
		meteors = [];
		target = null;
		overAt = performance.now();
		phase = 'over';
	}

	function resume() {
		if (phase !== 'paused') return;
		countdown = RESUME_COUNTDOWN;
		countdownShown = RESUME_COUNTDOWN;
		phase = 'countdown';
		wake();
	}

	// Escape toggles the pause menu in game; elsewhere it steps back (results -> menu -> close)
	function handleEscape() {
		if (phase === 'playing' || phase === 'countdown') pause();
		else if (phase === 'paused') resume();
		else if (phase === 'over') toMenu();
		else onexit?.();
	}

	// Pause menu options, picked with 1 / 2 (or arrows) and confirmed with Enter
	const PAUSE_OPTIONS = [
		{ label: 'Continue', run: () => resume() },
		{ label: 'Main menu', run: () => toMenu() }
	];
	let pauseChoice = $state(0);

	function pause() {
		if (phase !== 'playing' && phase !== 'countdown') return;
		phase = 'paused';
		pauseChoice = 0;
		heldKeys.clear();
		draw();
	}

	// --- Spawning ---
	function pickWord(): string {
		const { min, max } = wordLengths(rampTime);
		const sized = TYPING_WORDS.filter((w) => w.length >= min && w.length <= max);
		// Prefer a word whose first letter isn't already on screen, so each letter locks one meteor
		const taken = new Set(meteors.map((m) => m.word[0]));
		const onScreen = new Set(meteors.map((m) => m.word));
		const fresh = sized.filter((w) => !taken.has(w[0]) && !onScreen.has(w));
		const pool = fresh.length ? fresh : sized.filter((w) => !onScreen.has(w));
		return pool[Math.floor(Math.random() * pool.length)] ?? 'quack';
	}

	function spawnMeteor() {
		if (!ctx) return;
		const word = pickWord();
		ctx.font = font();
		const textWidth = ctx.measureText(word).width;
		const r = Math.max(30, textWidth / 2 + 16);
		const vertexCount = 7 + Math.floor(Math.random() * 3);
		const verts = Array.from({ length: vertexCount }, () => 0.78 + Math.random() * 0.4);

		// Start just past a random point on the edge of the play area
		const theta = Math.random() * Math.PI * 2;
		const cos = Math.cos(theta);
		const sin = Math.sin(theta);
		const toEdge = Math.min(
			Math.abs(cos) > 1e-6 ? width / 2 / Math.abs(cos) : Infinity,
			Math.abs(sin) > 1e-6 ? height / 2 / Math.abs(sin) : Infinity
		);
		const dist = toEdge + r * 1.3;

		meteors.push({
			x: width / 2 + cos * dist,
			y: height / 2 + sin * dist,
			word,
			typed: 0,
			r,
			verts,
			angle: Math.random() * Math.PI,
			spin: (Math.random() - 0.5) * 0.6,
			pace: 0.85 + Math.random() * 0.3,
			distance: dist,
			aimX: (Math.random() - 0.5) * 30,
			aimY: (Math.random() - 0.5) * 30,
			flash: 0
		});
	}

	// --- Effects ---
	function clearAfterHit() {
		for (const m of meteors) burst(m, 'rgba(200, 200, 215, 0.8)');
		meteors = [];
		target = null;
		rampTime *= 1 - HIT_SLOWDOWN;
		spawnTimer = Math.max(spawnTimer, HIT_COOLDOWN);
		shockwave = 0;
	}

	function burst(m: Meteor, color: string) {
		const pixel = gameDevMode.active;
		const count = 26 + m.word.length * 2;
		for (let i = 0; i < count; i++) {
			const a = Math.random() * Math.PI * 2;
			const speed = 40 + Math.random() * 170;
			const life = 0.5 + Math.random() * 0.6;
			particles.push({
				x: m.x + Math.cos(a) * m.r * Math.random(),
				y: m.y + Math.sin(a) * m.r * Math.random(),
				vx: Math.cos(a) * speed,
				vy: Math.sin(a) * speed,
				life,
				maxLife: life,
				len: pixel ? 4 : 3 + Math.random() * 6,
				rot: Math.random() * Math.PI,
				vr: (Math.random() - 0.5) * 10,
				color
			});
		}
	}

	function destroy(m: Meteor) {
		meteors = meteors.filter((other) => other !== m);
		if (target === m) target = null;
	}

	// Only meteors that have drifted into view can be locked onto
	const isVisible = (m: Meteor) =>
		m.x > -m.r * 0.4 && m.x < width + m.r * 0.4 && m.y > -m.r * 0.4 && m.y < height + m.r * 0.4;

	// --- Input ---
	function handleKeydown(e: KeyboardEvent) {
		if (!active || e.ctrlKey || e.metaKey || e.altKey) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			if (!e.repeat) handleEscape();
			return;
		}
		heldKeys.add(e.code);
		typingPose = true;
		wake();

		const isChar = e.key.length === 1;
		if (isChar || e.key === 'Backspace' || e.key === 'Enter') e.preventDefault();
		if (e.repeat) return;

		if (phase === 'menu') {
			if (e.key.startsWith('Arrow')) e.preventDefault();
			const index = DIFFICULTY_ORDER.indexOf(difficulty);
			if (e.key === ' ' || e.key === 'Enter') startGame();
			else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')
				chooseDifficulty(DIFFICULTY_ORDER[Math.max(0, index - 1)]);
			else if (e.key === 'ArrowRight' || e.key === 'ArrowDown')
				chooseDifficulty(DIFFICULTY_ORDER[Math.min(DIFFICULTY_ORDER.length - 1, index + 1)]);
			else if (['1', '2', '3'].includes(e.key))
				chooseDifficulty(DIFFICULTY_ORDER[Number(e.key) - 1]);
			return;
		}
		if (phase === 'paused') {
			if (e.key.startsWith('Arrow')) e.preventDefault();
			if (e.key === 'Enter' || e.key === ' ') PAUSE_OPTIONS[pauseChoice].run();
			else if (e.key === '1' || e.key === '2') pauseChoice = Number(e.key) - 1;
			else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') pauseChoice = 0;
			else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') pauseChoice = 1;
			return;
		}
		if (phase === 'countdown') return;
		if (phase === 'over') {
			// A short delay so frantic typing at the moment of defeat doesn't skip the results
			if (performance.now() - overAt < 700) return;
			if (e.key === ' ' || e.key === 'Enter') startGame();
			return;
		}

		if (e.key === 'Backspace') {
			if (target) target.typed = 0;
			target = null;
			return;
		}
		if (!isChar || e.key === ' ') return;

		const key = e.key.toLowerCase();
		keystrokes++;

		if (!target) {
			// Lock onto the closest meteor starting with this letter
			let closest: Meteor | null = null;
			let closestDist = Infinity;
			for (const m of meteors) {
				if (m.word[0] !== key || !isVisible(m)) continue;
				const d = Math.hypot(m.x - width / 2, m.y - height / 2);
				if (d < closestDist) {
					closest = m;
					closestDist = d;
				}
			}
			if (!closest) {
				synth.playGameSfx('miss');
				return;
			}
			target = closest;
		} else if (target.word[target.typed] !== key) {
			target.flash = 0.25;
			synth.playGameSfx('miss');
			return;
		}

		// Correct letter: fire at the target
		correctKeystrokes++;
		target.typed++;
		bullets.push({ x: width / 2, y: height / 2, tx: target.x, ty: target.y });

		if (target.typed >= target.word.length) {
			correctChars += target.word.length + 1;
			wordsDestroyed++;
			burst(target, ACCENT);
			synth.playGameSfx('boom');
			destroy(target);
		} else {
			synth.playGameSfx('shot');
		}
	}

	function handleKeyup(e: KeyboardEvent) {
		heldKeys.delete(e.code);
		typingPose = heldKeys.size > 0;
		wake();
	}

	function handleBlur() {
		heldKeys.clear();
		typingPose = false;
		pause();
	}

	function handleVisibility() {
		if (document.hidden) handleBlur();
	}

	// --- Loop ---
	const running = () => active && phase !== 'paused';

	function wake() {
		if (rafId || !running()) return;
		lastTime = performance.now();
		rafId = requestAnimationFrame(frame);
	}

	function frame(now: number) {
		rafId = 0;
		if (!running()) {
			draw();
			return;
		}
		const dt = Math.min(0.05, (now - lastTime) / 1000);
		lastTime = now;
		update(dt);
		draw();
		rafId = requestAnimationFrame(frame);
	}

	function update(dt: number) {
		const cx = width / 2;
		const cy = height / 2;

		if (!reducedMotion) {
			for (const s of stars) {
				s.x -= 0.004 * s.z * dt;
				if (s.x < 0) s.x += 1;
			}
		}

		if (phase === 'countdown') {
			countdown -= dt;
			countdownShown = Math.max(1, Math.ceil(countdown));
			if (countdown <= 0) phase = 'playing';
		} else if (phase === 'playing') {
			elapsed += dt;
			rampTime += dt;
			invulnerable = Math.max(0, invulnerable - dt);

			spawnTimer -= dt;
			if (spawnTimer <= 0) {
				spawnMeteor();
				spawnTimer = spawnInterval(rampTime);
			}

			const travel = travelTime(rampTime);
			for (const m of [...meteors]) {
				// Steer toward the duck every frame, so meteors still home in after the window resizes
				const dx = cx + m.aimX - m.x;
				const dy = cy + m.aimY - m.y;
				const dist = Math.hypot(dx, dy) || 1;
				const speed = (m.distance / travel) * m.pace;
				m.x += (dx / dist) * speed * dt;
				m.y += (dy / dist) * speed * dt;
				m.angle += m.spin * dt;
				m.flash = Math.max(0, m.flash - dt);

				if (Math.hypot(m.x - cx, m.y - cy) < m.r * 0.8 + DUCK_RADIUS) {
					burst(m, 'rgba(255, 110, 110, 0.9)');
					destroy(m);
					if (invulnerable > 0) continue;
					lives--;
					invulnerable = INVULNERABLE_SECONDS;
					shake = reducedMotion ? 0 : 12;
					synth.playGameSfx('hit');
					if (lives <= 0) {
						endGame();
						break;
					}
					clearAfterHit();
					break;
				}
			}

			wpmTimer -= dt;
			if (wpmTimer <= 0) {
				wpm = computeWpm();
				clock = elapsed;
				wpmTimer = 0.25;
			}
		}

		// Face whatever the duck is shooting at, or the closest threat
		const focus =
			target ??
			meteors.reduce<Meteor | null>(
				(near, m) =>
					!near || Math.hypot(m.x - cx, m.y - cy) < Math.hypot(near.x - cx, near.y - cy) ? m : near,
				null
			);
		if (focus && Math.abs(focus.x - cx) > 4) facing = focus.x > cx ? 1 : -1;

		for (const b of bullets) {
			const dx = b.tx - b.x;
			const dy = b.ty - b.y;
			const dist = Math.hypot(dx, dy);
			const step = BULLET_SPEED * dt;
			if (dist <= step) {
				b.x = b.tx;
				b.y = b.ty;
			} else {
				b.x += (dx / dist) * step;
				b.y += (dy / dist) * step;
			}
		}
		bullets = bullets.filter((b) => b.x !== b.tx || b.y !== b.ty);

		for (const p of particles) {
			p.x += p.vx * dt;
			p.y += p.vy * dt;
			p.vx *= 0.97;
			p.vy *= 0.97;
			p.rot += p.vr * dt;
			p.life -= dt;
		}
		particles = particles.filter((p) => p.life > 0);

		shake = Math.max(0, shake - 40 * dt);
		if (shockwave >= 0) {
			shockwave += dt;
			if (shockwave > SHOCKWAVE_SECONDS) shockwave = -1;
		}
	}

	// --- Drawing ---
	function draw() {
		if (!ctx) return;
		const pixel = gameDevMode.active;
		const cx = width / 2;
		const cy = height / 2;

		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, width, height);
		if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

		// Stars
		for (const s of stars) {
			ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + s.z * 0.45})`;
			const size = s.z > 0.75 ? 2 : 1;
			ctx.fillRect(Math.round(s.x * width), Math.round(s.y * height), size, size);
		}

		// Shockwave ring from the duck after a hit
		if (shockwave >= 0) {
			const progress = shockwave / SHOCKWAVE_SECONDS;
			ctx.globalAlpha = 1 - progress;
			ctx.strokeStyle = ACCENT;
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.arc(cx, cy, Math.hypot(cx, cy) * (1 - (1 - progress) ** 3), 0, Math.PI * 2);
			ctx.stroke();
			ctx.globalAlpha = 1;
		}

		// Bullets
		ctx.fillStyle = ACCENT;
		for (const b of bullets) ctx.fillRect(b.x - 1.5, b.y - 1.5, 3, 3);

		// Meteors
		ctx.font = font();
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'left';
		ctx.lineJoin = pixel ? 'miter' : 'round';
		for (const m of meteors) {
			const isTarget = m === target;
			ctx.beginPath();
			m.verts.forEach((factor, i) => {
				const a = m.angle + (i / m.verts.length) * Math.PI * 2;
				const x = m.x + Math.cos(a) * m.r * factor;
				const y = m.y + Math.sin(a) * m.r * factor;
				if (i === 0) ctx!.moveTo(x, y);
				else ctx!.lineTo(x, y);
			});
			ctx.closePath();
			ctx.fillStyle = 'rgba(7, 6, 13, 0.85)';
			ctx.fill();
			ctx.lineWidth = isTarget ? 2.5 : 2;
			ctx.strokeStyle = m.flash > 0 ? '#ff6b6b' : isTarget ? ACCENT : 'rgba(190, 188, 205, 0.75)';
			ctx.stroke();

			// Word: typed letters in the accent color, the rest in white
			const done = m.word.slice(0, m.typed);
			const rest = m.word.slice(m.typed);
			const total = ctx.measureText(m.word).width;
			const startX = m.x - total / 2;
			ctx.fillStyle = ACCENT;
			ctx.fillText(done, startX, m.y + (pixel ? 1 : 0));
			ctx.fillStyle = '#ffffff';
			ctx.fillText(rest, startX + ctx.measureText(done).width, m.y + (pixel ? 1 : 0));
		}

		// Particles: short broken-line fragments (square chips in pixel mode)
		for (const p of particles) {
			const alpha = Math.max(0, p.life / p.maxLife);
			ctx.globalAlpha = alpha;
			if (pixel) {
				ctx.fillStyle = p.color;
				ctx.fillRect(Math.round(p.x), Math.round(p.y), p.len, p.len);
			} else {
				ctx.strokeStyle = p.color;
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.moveTo(p.x - (Math.cos(p.rot) * p.len) / 2, p.y - (Math.sin(p.rot) * p.len) / 2);
				ctx.lineTo(p.x + (Math.cos(p.rot) * p.len) / 2, p.y + (Math.sin(p.rot) * p.len) / 2);
				ctx.stroke();
			}
		}
		ctx.globalAlpha = 1;

		// Duck: frame 2 while any key is held, frame 1 otherwise; blinks while invulnerable
		const blinking = invulnerable > 0 && Math.floor(invulnerable * 10) % 2 === 0;
		// The menu shows its own bigger duck
		if (sprite?.complete && !blinking && phase !== 'menu') {
			const size = SPRITE_FRAME * SPRITE_SCALE;
			const frameIndex = heldKeys.size > 0 ? 1 : 0;
			ctx.save();
			ctx.imageSmoothingEnabled = false;
			ctx.translate(Math.round(cx), Math.round(cy));
			ctx.scale(-facing, 1);
			ctx.drawImage(
				sprite,
				frameIndex * SPRITE_FRAME,
				0,
				SPRITE_FRAME,
				SPRITE_FRAME,
				-size / 2,
				-size / 2,
				size,
				size
			);
			ctx.restore();
		}
	}

	// Redraw in the new font when pixel mode toggles while the loop is asleep
	$effect(() => {
		void gameDevMode.active;
		if (!running()) draw();
	});

	// Pause the loop while the modal closes, resume when it's active again
	$effect(() => {
		if (active) wake();
		else heldKeys.clear();
	});

	onMount(() => {
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		makeStars();
		loadSaved();

		sprite = new Image();
		sprite.src = '/GameAssets/KeyboardWarrior.png';
		sprite.onload = () => draw();

		resize();
		const observer = new ResizeObserver(resize);
		if (wrapper) observer.observe(wrapper);
		document.addEventListener('visibilitychange', handleVisibility);
		wake();

		return () => {
			cancelAnimationFrame(rafId);
			rafId = 0;
			observer.disconnect();
			document.removeEventListener('visibilitychange', handleVisibility);
		};
	});

	const formatTime = (seconds: number) => {
		const s = Math.floor(seconds);
		return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
	};
</script>

<svelte:window onkeydown={handleKeydown} onkeyup={handleKeyup} onblur={handleBlur} />

<div
	bind:this={wrapper}
	class="relative min-h-0 w-full flex-1 overflow-hidden bg-[#07060d] {gameDevMode.active
		? 'font-pixel'
		: ''}"
>
	<canvas bind:this={canvas} class="absolute inset-0 size-full" aria-hidden="true"></canvas>

	<!-- HUD -->
	{#if phase !== 'menu'}
		<div
			class="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3 sm:p-4"
		>
			<div class="flex gap-1.5" aria-label="{lives} of {MAX_LIVES} lives left">
				{#each [...Array(MAX_LIVES).keys()] as i (i)}
					<Heart
						class="size-6 transition-all duration-200 {i < lives
							? 'fill-accent/80 text-accent'
							: 'scale-90 text-accent/30'}"
					/>
				{/each}
			</div>
			<div class="text-right">
				<p
					class="font-extrabold text-white {gameDevMode.active
						? 'text-sm'
						: 'text-2xl sm:text-3xl'}"
				>
					WPM: {wpm}
				</p>
				{#if phase === 'playing' || phase === 'paused' || phase === 'countdown'}
					<p class="mt-1 text-muted {gameDevMode.active ? 'text-[8px]' : 'text-xs'}">
						{DIFFICULTIES[difficulty].label} · {formatTime(clock)}
					</p>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Overlays -->
	{#if phase === 'menu'}
		<div class="absolute inset-0 flex items-center justify-center overflow-y-auto bg-black/30 p-4">
			<div class="flex w-full max-w-2xl flex-col items-center text-center">
				<!-- Menu duck: same sprite sheet, typing frame while a key is held -->
				<div
					aria-hidden="true"
					class="size-32 bg-no-repeat pixelated"
					style="background-image: url('/GameAssets/KeyboardWarrior.png'); background-size: 256px 128px; background-position: {typingPose
						? '-128px'
						: '0'} 0;"
				></div>
				<h2
					class="mt-1 font-extrabold tracking-wide text-white {gameDevMode.active
						? 'text-base sm:text-xl'
						: 'text-3xl sm:text-4xl'}"
				>
					Keyboard Warrior
				</h2>
				<p
					class="mx-auto mt-2 max-w-md text-muted {gameDevMode.active
						? 'text-[8px] leading-loose'
						: 'text-sm'}"
				>
					Type a meteor's word to blast it before it reaches the duck. The first letter locks on,
					Backspace lets it go. Three hits and it's over.
				</p>

				<!-- Difficulty -->
				<div
					class="mt-6 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-3"
					role="radiogroup"
					aria-label="Difficulty"
				>
					{#each DIFFICULTY_ORDER as d, i (d)}
						{@const config = DIFFICULTIES[d]}
						{@const selected = d === difficulty}
						<button
							type="button"
							role="radio"
							aria-checked={selected}
							onclick={() => chooseDifficulty(d)}
							class="flex cursor-pointer flex-col items-start gap-1 border p-3.5 text-left backdrop-blur-md transition-all duration-150 {selected
								? 'border-accent bg-accent/25 shadow-[0_0_24px_-8px_rgba(182,148,255,0.6)]'
								: 'border-white/15 bg-white/[0.09] hover:border-white/30 hover:bg-white/[0.13]'}"
						>
							<span class="flex w-full items-center justify-between">
								<span
									class="font-extrabold {selected
										? 'text-accent'
										: 'text-white'} {gameDevMode.active ? 'text-[10px]' : 'text-base'}"
								>
									{config.label}
								</span>
								<span class="text-faint {gameDevMode.active ? 'text-[7px]' : 'text-xs'}"
									>{i + 1}</span
								>
							</span>
							<span
								class="text-muted {gameDevMode.active ? 'text-[7px] leading-relaxed' : 'text-xs'}"
							>
								{config.blurb}
							</span>
							<span
								class="mt-1 {bests[d].seconds
									? 'text-accent-soft'
									: 'text-faint'} {gameDevMode.active
									? 'text-[7px] leading-relaxed'
									: 'text-xs font-bold'}"
							>
								{bests[d].seconds
									? `Best: ${bests[d].wpm} WPM · ${formatTime(bests[d].seconds)}`
									: 'No best yet'}
							</span>
						</button>
					{/each}
				</div>

				<button
					type="button"
					onclick={startGame}
					class="mt-6 inline-flex cursor-pointer items-center gap-2 border border-accent/50 bg-accent/25 px-7 py-3 font-extrabold text-accent backdrop-blur-md transition-colors hover:bg-accent hover:text-bg {gameDevMode.active
						? 'text-[10px]'
						: 'text-base'}"
				>
					<Play class="size-4" />
					Start (Space)
				</button>
				<p class="mt-3 text-faint {gameDevMode.active ? 'text-[7px]' : 'text-xs'}">
					Arrow keys or 1 / 2 / 3 to pick a difficulty
				</p>
			</div>
		</div>
	{:else if phase === 'paused'}
		<div
			class="absolute inset-0 flex flex-col items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
		>
			<p class="font-extrabold text-white {gameDevMode.active ? 'text-sm' : 'text-3xl'}">Paused</p>
			<div class="mt-5 flex w-full max-w-xs flex-col gap-2.5" role="menu" aria-label="Pause menu">
				{#each PAUSE_OPTIONS as option, i (option.label)}
					{@const selected = i === pauseChoice}
					<button
						type="button"
						role="menuitem"
						onclick={option.run}
						onpointerenter={() => (pauseChoice = i)}
						class="flex cursor-pointer items-center gap-3 border px-4 py-3 text-left font-extrabold backdrop-blur-md transition-all duration-150 {selected
							? 'border-accent bg-accent/25 text-accent shadow-[0_0_24px_-8px_rgba(182,148,255,0.6)]'
							: 'border-white/15 bg-white/[0.09] text-white/85'} {gameDevMode.active
							? 'text-[10px]'
							: 'text-base'}"
					>
						<span
							class="flex size-6 shrink-0 items-center justify-center border text-xs {selected
								? 'border-accent/60'
								: 'border-white/20 text-muted'}">{i + 1}</span
						>
						{#if i === 0}<Play class="size-4" />{:else}<House class="size-4" />{/if}
						{option.label}
					</button>
				{/each}
			</div>
			<p class="mt-4 text-faint {gameDevMode.active ? 'text-[7px]' : 'text-xs'}">
				1 / 2 to choose, Enter to confirm, Esc to resume
			</p>
		</div>
	{:else if phase === 'countdown'}
		<div class="pointer-events-none absolute inset-x-0 top-[18%] flex flex-col items-center">
			<p class="text-muted {gameDevMode.active ? 'text-[9px]' : 'text-sm font-bold'}">Get ready</p>
			{#key countdownShown}
				<p
					class="anim-fade-in-up font-extrabold text-accent {gameDevMode.active
						? 'mt-3 text-4xl'
						: 'text-8xl'}"
				>
					{countdownShown}
				</p>
			{/key}
		</div>
	{:else if phase === 'over'}
		<div class="absolute inset-0 flex items-center justify-center bg-black/55 p-4">
			<div class="w-full max-w-sm text-center">
				<p class="font-extrabold text-red-300 {gameDevMode.active ? 'text-sm' : 'text-2xl'}">
					The duck got hit!
				</p>
				<p class="mt-1 text-muted {gameDevMode.active ? 'text-[8px]' : 'text-sm'}">
					{DIFFICULTIES[difficulty].label}
					{#if result.newBest}
						· <span class="font-bold text-accent">New best!</span>
					{/if}
				</p>
				<div class="mt-5 grid grid-cols-2 gap-2.5">
					{#each [{ label: 'WPM', value: result.wpm }, { label: 'Accuracy', value: `${result.accuracy}%` }, { label: 'Words', value: result.words }, { label: 'Survived', value: formatTime(result.seconds) }] as stat (stat.label)}
						<div class="bg-white/[0.09] p-3 backdrop-blur-md">
							<p class="text-muted {gameDevMode.active ? 'text-[7px]' : 'text-xs'}">{stat.label}</p>
							<p
								class="mt-1 font-extrabold text-white {gameDevMode.active ? 'text-sm' : 'text-2xl'}"
							>
								{stat.value}
							</p>
						</div>
					{/each}
				</div>
				<div class="mt-5 flex flex-wrap justify-center gap-2.5">
					<button
						type="button"
						onclick={startGame}
						class="inline-flex cursor-pointer items-center gap-2 border border-accent/50 bg-accent/25 px-5 py-2.5 font-extrabold text-accent backdrop-blur-md transition-colors hover:bg-accent hover:text-bg {gameDevMode.active
							? 'text-[9px]'
							: 'text-sm'}"
					>
						<RotateCcw class="size-4" />
						Play again (Space)
					</button>
					<button
						type="button"
						onclick={toMenu}
						class="inline-flex cursor-pointer items-center gap-2 border border-white/20 bg-white/[0.12] px-5 py-2.5 font-bold text-white/85 backdrop-blur-md transition-colors hover:bg-white/20 hover:text-white {gameDevMode.active
							? 'text-[9px]'
							: 'text-sm'}"
					>
						<House class="size-4" />
						Main menu (Esc)
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
