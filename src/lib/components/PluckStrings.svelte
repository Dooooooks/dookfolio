<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		// The UI to keep clear: strings stop short of this element (plus a margin) and are never drawn over it
		avoid?: HTMLElement | null;
	}

	let { avoid = null }: Props = $props();

	// A vertical string segment, pinned at both ends. When the cursor is near, the string bends
	// gently toward it, then glides back to straight once the cursor moves away (no vibration)
	interface Segment {
		x: number;
		y0: number;
		y1: number;
		bend: number; // current sideways offset at the bend point (px, signed)
		at: number; // where along the string the bend is centred (y)
	}

	const SPACING = 26; // px between strings
	const AVOID_MARGIN = 28; // px of clear space kept around the UI
	const MIN_LENGTH = 40; // segments shorter than this aren't worth drawing
	const REACH = 70; // px: how far sideways from the cursor strings react
	const PULL = 0.75; // how strongly a string leans toward the cursor
	const BEND_SPREAD = 70; // px: how much of the string's length the bend covers
	const BEND_EASE = 0.18; // how quickly strings follow / settle back (0–1 per frame)
	const BASE_COLOR = 'rgba(255, 255, 255, 0.07)';
	const SPOT_RGB = '182, 148, 255'; // --color-accent
	const SPOT_RADIUS = 170; // px
	const SPOT_EASE = 0.22; // how quickly the spotlight catches up with the cursor (0–1 per frame)

	let canvas: HTMLCanvasElement;
	let segments: Segment[] = [];
	let width = 0;
	let height = 0;
	let dpr = 1;
	let frame = 0;
	let reduceMotion = false;

	// Spotlight that follows the cursor and tints only the strings inside it
	const spot = { x: 0, y: 0, targetX: 0, targetY: 0, alpha: 0, targetAlpha: 0 };

	function layout() {
		if (!canvas) return;
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		width = window.innerWidth;
		height = window.innerHeight;
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);

		const r = avoid?.getBoundingClientRect();
		const box = r
			? {
					left: r.left - AVOID_MARGIN,
					right: r.right + AVOID_MARGIN,
					top: r.top - AVOID_MARGIN,
					bottom: r.bottom + AVOID_MARGIN
				}
			: null;

		// Keep any vibration already happening on strings that still exist at the same spot
		const previous = new Map(segments.map((s) => [`${s.x}:${s.y0}`, s]));
		const next: Segment[] = [];
		const offset = (width % SPACING) / 2;

		for (let x = offset + SPACING / 2; x < width; x += SPACING) {
			const blocked = box && x > box.left && x < box.right;
			// Columns that run into the UI are split into a piece above it and a piece below it
			const spans: [number, number][] = blocked
				? [
						[0, box.top],
						[box.bottom, height]
					]
				: [[0, height]];
			for (const [y0, y1] of spans) {
				const top = Math.max(0, y0);
				const bottom = Math.min(height, y1);
				if (bottom - top < MIN_LENGTH) continue;
				const old = previous.get(`${x}:${top}`);
				next.push(
					old && old.y1 === bottom
						? old
						: { x, y0: top, y1: bottom, bend: 0, at: (top + bottom) / 2 }
				);
			}
		}
		segments = next;
		requestDraw();
	}

	// Ease each string toward its target bend: leaning toward a nearby cursor, otherwise straight
	function updateBends(): boolean {
		let busy = false;
		const active = spot.targetAlpha > 0 && !reduceMotion;
		for (const seg of segments) {
			let target = 0;
			if (active) {
				const dx = spot.targetX - seg.x;
				const inside = spot.targetY > seg.y0 && spot.targetY < seg.y1;
				if (inside && Math.abs(dx) < REACH) {
					const falloff = 1 - Math.abs(dx) / REACH;
					target = dx * PULL * falloff * falloff;
					seg.at += (spot.targetY - seg.at) * 0.35;
				}
			}
			seg.bend += (target - seg.bend) * BEND_EASE;
			if (Math.abs(target - seg.bend) > 0.05) busy = true;
			else seg.bend = target;
		}
		return busy;
	}

	function draw() {
		frame = 0;
		const ctx = canvas?.getContext('2d');
		if (!ctx) return;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.clearRect(0, 0, width, height);

		// All strings go in one path: drawn once faintly, then again through the spotlight
		const path = new Path2D();
		const busy = updateBends();
		for (const seg of segments) {
			const d = seg.bend;

			if (Math.abs(d) < 0.05) {
				path.moveTo(seg.x, seg.y0);
				path.lineTo(seg.x, seg.y1);
				continue;
			}
			// Smooth bump centred on the cursor's height, tapering to zero at both pinned ends
			const from = Math.max(seg.y0, seg.at - BEND_SPREAD * 3);
			const to = Math.min(seg.y1, seg.at + BEND_SPREAD * 3);
			path.moveTo(seg.x, seg.y0);
			const steps = 30;
			for (let i = 0; i <= steps; i++) {
				const y = from + ((to - from) * i) / steps;
				const bump = Math.exp(-((y - seg.at) ** 2) / (2 * BEND_SPREAD ** 2));
				const pin = Math.min(1, (y - seg.y0) / 30, (seg.y1 - y) / 30);
				path.lineTo(seg.x + d * bump * Math.max(0, pin), y);
			}
			path.lineTo(seg.x, seg.y1);
		}

		ctx.lineWidth = 1;
		ctx.strokeStyle = BASE_COLOR;
		ctx.stroke(path);

		// Ease the spotlight toward the cursor and fade it in/out
		spot.x += (spot.targetX - spot.x) * SPOT_EASE;
		spot.y += (spot.targetY - spot.y) * SPOT_EASE;
		spot.alpha += (spot.targetAlpha - spot.alpha) * 0.15;
		const settling =
			Math.abs(spot.targetX - spot.x) > 0.3 ||
			Math.abs(spot.targetY - spot.y) > 0.3 ||
			Math.abs(spot.targetAlpha - spot.alpha) > 0.01;

		if (spot.alpha > 0.01) {
			const glow = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, SPOT_RADIUS);
			glow.addColorStop(0, `rgba(${SPOT_RGB}, ${0.75 * spot.alpha})`);
			glow.addColorStop(0.45, `rgba(${SPOT_RGB}, ${0.35 * spot.alpha})`);
			glow.addColorStop(1, `rgba(${SPOT_RGB}, 0)`);
			ctx.strokeStyle = glow;
			ctx.stroke(path);
		}

		if (busy || settling) frame = requestAnimationFrame(draw);
	}

	function requestDraw() {
		if (!frame) frame = requestAnimationFrame(draw);
	}

	// Track the cursor: it drives both the spotlight and which strings lean toward it
	function handleMove(e: PointerEvent) {
		spot.targetX = e.clientX;
		spot.targetY = e.clientY;
		if (spot.targetAlpha === 0) {
			// Appear right under the cursor instead of sliding in from the last spot
			spot.x = e.clientX;
			spot.y = e.clientY;
		}
		spot.targetAlpha = 1;
		requestDraw();
	}

	// Cursor left the page (or a touch ended): fade the spotlight out
	function hideSpot() {
		spot.targetAlpha = 0;
		requestDraw();
	}

	// Re-measure whenever the UI we're avoiding changes size (e.g. start screen -> round)
	$effect(() => {
		if (!avoid) return;
		const observer = new ResizeObserver(layout);
		observer.observe(avoid);
		return () => observer.disconnect();
	});

	onMount(() => {
		reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		layout();

		window.addEventListener('resize', layout);
		window.addEventListener('scroll', layout, { passive: true });
		window.addEventListener('pointermove', handleMove, { passive: true });
		window.addEventListener('pointercancel', hideSpot);
		window.addEventListener('blur', hideSpot);
		document.addEventListener('mouseleave', hideSpot);
		window.addEventListener('touchend', hideSpot);

		return () => {
			window.removeEventListener('resize', layout);
			window.removeEventListener('scroll', layout);
			window.removeEventListener('pointermove', handleMove);
			window.removeEventListener('pointercancel', hideSpot);
			window.removeEventListener('blur', hideSpot);
			document.removeEventListener('mouseleave', hideSpot);
			window.removeEventListener('touchend', hideSpot);
			if (frame) cancelAnimationFrame(frame);
		};
	});
</script>

<!-- Decorative, behind everything, and never catches clicks -->
<canvas
	bind:this={canvas}
	aria-hidden="true"
	class="pointer-events-none fixed inset-0 h-full w-full"
	style="width: 100vw; height: 100dvh;"
></canvas>
