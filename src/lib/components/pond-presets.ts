export type PondVariant = 'feather' | 'lily' | 'reed' | 'ripple' | 'crumb';
export type DepthLayer = 'bg' | 'mg' | 'fg';

export interface ShardTransform {
	x: number; // percentage (0 - 100)
	y: number; // percentage (0 - 100)
	rot: number; // degrees
	scale: number;
}

export interface ShardDefinition {
	id: string;
	variant: PondVariant;
	animClass: string;
	delay: string;
	fill: string;
	stroke: string;
	strokeWidth?: number;
	opacity?: number;
	layer?: DepthLayer;
}

export interface RouteLayout {
	left: ShardTransform[];
	right: ShardTransform[];
}

// Consistent color palette across all pages AND gaming mode
export const PALETTE = {
	fillGrad1: 'url(#flank-grad-1)',
	fillGrad2: 'url(#flank-grad-2)',
	fillSolid: 'rgba(182, 148, 255, 0.09)',
	stroke: 'rgba(182, 148, 255, 0.5)',
	strokeSoft: 'rgba(203, 177, 255, 0.35)',
	strokeWidth: 1.5
};

// A smooth-mode part: 'body' takes fill + stroke, 'line' is stroke only, 'dot' is filled with the stroke color
export interface ShapePart {
	kind: 'body' | 'line' | 'dot';
	d: string;
}

export interface PondShape {
	smooth: ShapePart[];
	// Pixel art bitmap: '#' outline, 'o' interior, '*' accent (eye), '.' empty
	bitmap: string[];
	pixelSize: number;
	// How much of the route layout rotation applies (reeds and ripples stay mostly level)
	rotFactor: number;
	// How strongly the item sways with the water and leaves wake rings (0 = stays still)
	bob: number;
	// Drawing size relative to the shared viewBox
	size: number;
}

function ellipse(rx: number, ry: number) {
	return `M ${-rx},0 a ${rx},${ry} 0 1 0 ${rx * 2},0 a ${rx},${ry} 0 1 0 ${-rx * 2},0 Z`;
}

// All smooth shapes are drawn facing right (toward the content on the left flank) within the -80 -50 160 100 viewBox
export const POND_SHAPES: Record<PondVariant, PondShape> = {
	// Drifting feather with a curved shaft
	feather: {
		smooth: [
			{ kind: 'body', d: 'M -50,30 C -40,0 -10,-30 40,-38 C 30,-10 0,20 -50,30 Z' }
		],
		bitmap: [
			'.............##',
			'...........##o#',
			'.........##oo#.',
			'.......##ooo#..',
			'.....##oooo#...',
			'....#ooooo#....',
			'...#oooo##.....',
			'..#ooo##.......',
			'.#o##..........',
			'#..............'
		],
		pixelSize: 7,
		rotFactor: 1,
		bob: 1.6,
		size: 1
	},
	// Lily pad with its notch facing right
	lily: {
		smooth: [
			{ kind: 'body', d: 'M 0,0 L 49,-12 A 52,36 0 1 0 49,12 Z' }
		],
		bitmap: [
			'....########....',
			'..##oooooooo##..',
			'.#oooooooooooo#.',
			'#oooooooooo###..',
			'#oooooooo##.....',
			'#oooooooooo###..',
			'.#oooooooooooo#.',
			'..##oooooooo##..',
			'....########....'
		],
		pixelSize: 7,
		rotFactor: 0.5,
		bob: 0.6,
		size: 1
	},
	// Cattail reed
	reed: {
		smooth: [
			{ kind: 'line', d: 'M 0,46 C 2,20 -2,0 0,-12' },
			{ kind: 'body', d: 'M -6,-42 C -6,-50 6,-50 6,-42 L 6,-18 C 6,-10 -6,-10 -6,-18 Z' }
		],
		bitmap: [
			'.###.',
			'#ooo#',
			'#ooo#',
			'#ooo#',
			'#ooo#',
			'#ooo#',
			'.###.',
			'..#..',
			'..#..',
			'..#..',
			'..#..',
			'..#..',
			'..#..',
			'..#..'
		],
		pixelSize: 6,
		rotFactor: 0.3,
		bob: 1.2,
		size: 1
	},
	// Concentric water ripple rings
	ripple: {
		smooth: [
			{ kind: 'body', d: ellipse(60, 16) },
			{ kind: 'line', d: ellipse(32, 8) }
		],
		bitmap: [
			'......########......',
			'...###........###...',
			'.##....######....##.',
			'#....##......##....#',
			'.##....######....##.',
			'...###........###...',
			'......########......'
		],
		pixelSize: 6,
		rotFactor: 0,
		bob: 0,
		size: 1
	},
	// Breadcrumb chunk
	crumb: {
		smooth: [
			{
				kind: 'body',
				d: 'M -30,-14 C -18,-26 14,-24 26,-12 C 36,-2 30,18 14,22 C -4,28 -28,22 -34,8 C -38,-2 -36,-8 -30,-14 Z'
			}
		],
		bitmap: ['..####..', '.#oooo#.', '#oooooo#', '#ooooo##', '#ooooo#.', '.#ooo#..', '..###...'],
		pixelSize: 7,
		rotFactor: 1,
		bob: 1.4,
		size: 1
	}
};

// Merge horizontal runs of matching bitmap cells into one crisp path, centered on the origin
export function bitmapToPath(bitmap: string[], s: number, cells: string): string {
	const width = Math.max(...bitmap.map((row) => row.length));
	const ox = -(width * s) / 2;
	const oy = -(bitmap.length * s) / 2;
	let d = '';
	bitmap.forEach((row, y) => {
		let x = 0;
		while (x < row.length) {
			if (!cells.includes(row[x])) {
				x++;
				continue;
			}
			const start = x;
			while (x < row.length && cells.includes(row[x])) x++;
			d += `M ${ox + start * s},${oy + y * s} h ${(x - start) * s} v ${s} h ${-(x - start) * s} Z `;
		}
	});
	return d.trim();
}

export const POND_PIXEL_PATHS = Object.fromEntries(
	Object.entries(POND_SHAPES).map(([variant, shape]) => [
		variant,
		{
			outline: bitmapToPath(shape.bitmap, shape.pixelSize, '#*'),
			fill: bitmapToPath(shape.bitmap, shape.pixelSize, 'o')
		}
	])
) as Record<PondVariant, { outline: string; fill: string }>;

// --- Underwater scene: revealed as scrolling sinks the page into the pond ---

export const UNDERWATER = {
	bubbleStroke: 'rgba(170, 200, 255, 0.5)',
	bubbleFill: 'rgba(170, 200, 255, 0.06)',
	weedStroke: 'rgba(110, 190, 170, 0.42)'
};

export interface Bubble {
	x: number; // percentage across the flank
	size: number; // px
	duration: number; // seconds to rise the full height
	delay: number; // seconds (negative so bubbles are already mid-rise)
	drift: number; // px of sideways wobble
}

export interface Weed {
	x: number; // percentage across the flank
	height: number; // px
	delay: number; // seconds offset for the sway
}

// Small deterministic generator so bubbles look scattered but render identically on server and client
function seededRandom(seed: number) {
	return () => {
		seed = (seed * 16807) % 2147483647;
		return (seed - 1) / 2147483646;
	};
}

function makeBubbles(seed: number, count: number, weedXs: number[]): Bubble[] {
	const rand = seededRandom(seed);
	const scattered = Array.from({ length: count }, (_, i) => {
		const size = 6 + Math.round(rand() * 12);
		return {
			x: 8 + (i / count) * 84 + rand() * 8,
			size,
			// Small bubbles rise slowly, big ones hurry up to the surface
			duration: 20 - size * 0.6 + rand() * 3,
			delay: -rand() * 18,
			drift: 6 + rand() * 14
		};
	});
	// Thin streams of tiny bubbles trickling up from the pondweed
	const streams = weedXs.flatMap((x) =>
		Array.from({ length: 2 }, (_, i) => ({
			x: x + (rand() - 0.5) * 3,
			size: 4 + Math.round(rand() * 3),
			duration: 16 + rand() * 4,
			delay: -(i * 8 + rand() * 8),
			drift: 3 + rand() * 4
		}))
	);
	return [...scattered, ...streams];
}

export const POND_FLOOR: Record<'left' | 'right', { weeds: Weed[] }> = {
	left: {
		weeds: [
			{ x: 14, height: 210, delay: 0 },
			{ x: 30, height: 130, delay: -1.2 },
			{ x: 52, height: 250, delay: -2.1 },
			{ x: 74, height: 160, delay: -0.6 },
			{ x: 88, height: 110, delay: -1.7 }
		]
	},
	right: {
		weeds: [
			{ x: 12, height: 120, delay: -0.9 },
			{ x: 28, height: 240, delay: -1.9 },
			{ x: 48, height: 150, delay: -0.3 },
			{ x: 68, height: 220, delay: -1.4 },
			{ x: 86, height: 140, delay: -2.4 }
		]
	}
};

const frontWeedXs = (side: 'left' | 'right') =>
	POND_FLOOR[side].weeds.filter((w) => w.height > 180).map((w) => w.x);

export const BUBBLES = {
	left: makeBubbles(7, 9, frontWeedXs('left')),
	right: makeBubbles(13, 9, frontWeedXs('right'))
};

// Wavy pondweed strand rising from (0, 0) at the bottom to (0, -height)
export function weedPath(height: number): string {
	const h = height;
	return `M 0,0 C -10,${-h * 0.2} 10,${-h * 0.4} 0,${-h * 0.6} C -9,${-h * 0.75} 8,${-h * 0.88} 0,${-h}`;
}

// Pixel pondweed: a strand that zigzags one pixel left and right as it climbs
export function weedPixelPath(height: number, pixelSize = 5): string {
	const rows = Math.max(4, Math.round(height / pixelSize));
	const bitmap = Array.from({ length: rows }, (_, i) => {
		const col = Math.round(Math.sin(i * 0.45)) + 1;
		return '...'.slice(0, col) + '#' + '...'.slice(col + 1);
	});
	return bitmapToPath(bitmap, pixelSize, '#');
}

export const BUBBLE_PIXEL_PATH = bitmapToPath(
	['.###.', '#...#', '#...#', '#...#', '.###.'],
	2,
	'#'
);

// 14 Left Flank Pond Items with 3 Depth Tiers (Foreground, Midground, Background)
export const LEFT_SHARDS: ShardDefinition[] = [
	{
		id: 'shard-l-0',
		variant: 'lily',
		layer: 'fg',
		animClass: 'anim-shard-float-1',
		delay: '0s',
		fill: PALETTE.fillGrad1,
		stroke: PALETTE.stroke,
		strokeWidth: PALETTE.strokeWidth,
		opacity: 0.95
	},
	{
		id: 'shard-l-1',
		variant: 'feather',
		layer: 'mg',
		animClass: 'anim-shard-float-2',
		delay: '0.7s',
		fill: PALETTE.fillSolid,
		stroke: PALETTE.strokeSoft,
		strokeWidth: PALETTE.strokeWidth,
		opacity: 0.75
	},
	{
		id: 'shard-l-2',
		variant: 'feather',
		layer: 'fg',
		animClass: 'anim-shard-float-3',
		delay: '1.4s',
		fill: PALETTE.fillGrad2,
		stroke: PALETTE.stroke,
		strokeWidth: PALETTE.strokeWidth,
		opacity: 0.92
	},
	{
		id: 'shard-l-3',
		variant: 'reed',
		layer: 'mg',
		animClass: 'anim-shard-float-4',
		delay: '2.1s',
		fill: PALETTE.fillGrad1,
		stroke: PALETTE.stroke,
		strokeWidth: PALETTE.strokeWidth,
		opacity: 0.8
	},
	{
		id: 'shard-l-4',
		variant: 'crumb',
		layer: 'bg',
		animClass: 'anim-shard-float-5',
		delay: '0.3s',
		fill: PALETTE.fillSolid,
		stroke: PALETTE.strokeSoft,
		strokeWidth: 1.2,
		opacity: 0.48
	},
	{
		id: 'shard-l-5',
		variant: 'lily',
		layer: 'mg',
		animClass: 'anim-shard-float-1',
		delay: '1.8s',
		fill: PALETTE.fillSolid,
		stroke: PALETTE.strokeSoft,
		strokeWidth: PALETTE.strokeWidth,
		opacity: 0.72
	},
	{
		id: 'shard-l-6',
		variant: 'feather',
		layer: 'fg',
		animClass: 'anim-shard-float-2',
		delay: '2.8s',
		fill: PALETTE.fillGrad2,
		stroke: PALETTE.stroke,
		strokeWidth: PALETTE.strokeWidth,
		opacity: 0.94
	},
	{
		id: 'shard-l-7',
		variant: 'crumb',
		layer: 'bg',
		animClass: 'anim-shard-float-3',
		delay: '3.5s',
		fill: PALETTE.fillSolid,
		stroke: PALETTE.strokeSoft,
		strokeWidth: 1.2,
		opacity: 0.42
	},
	{
		id: 'shard-l-8',
		variant: 'reed',
		layer: 'mg',
		animClass: 'anim-shard-float-4',
		delay: '1.1s',
		fill: PALETTE.fillGrad1,
		stroke: PALETTE.stroke,
		strokeWidth: PALETTE.strokeWidth,
		opacity: 0.82
	},
	{
		id: 'shard-l-9',
		variant: 'ripple',
		layer: 'mg',
		animClass: 'anim-shard-float-5',
		delay: '2.4s',
		fill: PALETTE.fillGrad2,
		stroke: PALETTE.strokeSoft,
		strokeWidth: PALETTE.strokeWidth,
		opacity: 0.76
	},
	{
		id: 'shard-l-10',
		variant: 'crumb',
		layer: 'bg',
		animClass: 'anim-shard-float-1',
		delay: '4.2s',
		fill: PALETTE.fillSolid,
		stroke: PALETTE.strokeSoft,
		strokeWidth: 1.2,
		opacity: 0.45
	},
	{
		id: 'shard-l-11',
		variant: 'reed',
		layer: 'fg',
		animClass: 'anim-shard-float-2',
		delay: '1.6s',
		fill: PALETTE.fillGrad1,
		stroke: PALETTE.stroke,
		strokeWidth: PALETTE.strokeWidth,
		opacity: 0.95
	},
	{
		id: 'shard-l-12',
		variant: 'feather',
		layer: 'mg',
		animClass: 'anim-shard-float-3',
		delay: '0.9s',
		fill: PALETTE.fillSolid,
		stroke: PALETTE.strokeSoft,
		strokeWidth: PALETTE.strokeWidth,
		opacity: 0.7
	},
	{
		id: 'shard-l-13',
		variant: 'crumb',
		layer: 'bg',
		animClass: 'anim-shard-float-5',
		delay: '3.1s',
		fill: PALETTE.fillSolid,
		stroke: PALETTE.strokeSoft,
		strokeWidth: 1.0,
		opacity: 0.38
	}
];

// 14 Right Flank Pond Items with 3 Depth Tiers (Foreground, Midground, Background)
export const RIGHT_SHARDS: ShardDefinition[] = [
	{
		id: 'shard-r-0',
		variant: 'feather',
		layer: 'fg',
		animClass: 'anim-shard-float-2',
		delay: '0.4s',
		fill: PALETTE.fillGrad2,
		stroke: PALETTE.stroke,
		strokeWidth: PALETTE.strokeWidth,
		opacity: 0.95
	},
	{
		id: 'shard-r-1',
		variant: 'lily',
		layer: 'mg',
		animClass: 'anim-shard-float-3',
		delay: '1.2s',
		fill: PALETTE.fillSolid,
		stroke: PALETTE.strokeSoft,
		strokeWidth: PALETTE.strokeWidth,
		opacity: 0.74
	},
	{
		id: 'shard-r-2',
		variant: 'reed',
		layer: 'fg',
		animClass: 'anim-shard-float-1',
		delay: '0.2s',
		fill: PALETTE.fillGrad1,
		stroke: PALETTE.stroke,
		strokeWidth: PALETTE.strokeWidth,
		opacity: 0.92
	},
	{
		id: 'shard-r-3',
		variant: 'feather',
		layer: 'mg',
		animClass: 'anim-shard-float-4',
		delay: '1.9s',
		fill: PALETTE.fillGrad2,
		stroke: PALETTE.strokeSoft,
		strokeWidth: PALETTE.strokeWidth,
		opacity: 0.78
	},
	{
		id: 'shard-r-4',
		variant: 'crumb',
		layer: 'bg',
		animClass: 'anim-shard-float-5',
		delay: '0.8s',
		fill: PALETTE.fillSolid,
		stroke: PALETTE.strokeSoft,
		strokeWidth: 1.2,
		opacity: 0.46
	},
	{
		id: 'shard-r-5',
		variant: 'lily',
		layer: 'fg',
		animClass: 'anim-shard-float-2',
		delay: '2.5s',
		fill: PALETTE.fillGrad1,
		stroke: PALETTE.stroke,
		strokeWidth: PALETTE.strokeWidth,
		opacity: 0.96
	},
	{
		id: 'shard-r-6',
		variant: 'ripple',
		layer: 'mg',
		animClass: 'anim-shard-float-3',
		delay: '1.5s',
		fill: PALETTE.fillSolid,
		stroke: PALETTE.stroke,
		strokeWidth: PALETTE.strokeWidth,
		opacity: 0.75
	},
	{
		id: 'shard-r-7',
		variant: 'crumb',
		layer: 'bg',
		animClass: 'anim-shard-float-1',
		delay: '3.7s',
		fill: PALETTE.fillSolid,
		stroke: PALETTE.strokeSoft,
		strokeWidth: 1.2,
		opacity: 0.42
	},
	{
		id: 'shard-r-8',
		variant: 'reed',
		layer: 'mg',
		animClass: 'anim-shard-float-4',
		delay: '2.2s',
		fill: PALETTE.fillGrad1,
		stroke: PALETTE.strokeSoft,
		strokeWidth: PALETTE.strokeWidth,
		opacity: 0.8
	},
	{
		id: 'shard-r-9',
		variant: 'reed',
		layer: 'fg',
		animClass: 'anim-shard-float-5',
		delay: '1.0s',
		fill: PALETTE.fillGrad2,
		stroke: PALETTE.stroke,
		strokeWidth: PALETTE.strokeWidth,
		opacity: 0.94
	},
	{
		id: 'shard-r-10',
		variant: 'crumb',
		layer: 'bg',
		animClass: 'anim-shard-float-2',
		delay: '4.0s',
		fill: PALETTE.fillSolid,
		stroke: PALETTE.strokeSoft,
		strokeWidth: 1.2,
		opacity: 0.45
	},
	{
		id: 'shard-r-11',
		variant: 'lily',
		layer: 'mg',
		animClass: 'anim-shard-float-3',
		delay: '2.7s',
		fill: PALETTE.fillGrad1,
		stroke: PALETTE.stroke,
		strokeWidth: PALETTE.strokeWidth,
		opacity: 0.82
	},
	{
		id: 'shard-r-12',
		variant: 'feather',
		layer: 'mg',
		animClass: 'anim-shard-float-1',
		delay: '1.3s',
		fill: PALETTE.fillSolid,
		stroke: PALETTE.strokeSoft,
		strokeWidth: PALETTE.strokeWidth,
		opacity: 0.72
	},
	{
		id: 'shard-r-13',
		variant: 'crumb',
		layer: 'bg',
		animClass: 'anim-shard-float-4',
		delay: '3.3s',
		fill: PALETTE.fillSolid,
		stroke: PALETTE.strokeSoft,
		strokeWidth: 1.0,
		opacity: 0.38
	}
];

// Layout, Rotations, and Wide Variety of Scales per Route
export const ROUTE_LAYOUTS: Record<string, RouteLayout> = {
	// Home: Scattered pond with organic drift and dramatic scale range (0.24 to 1.35)
	home: {
		left: [
			{ x: 38, y: 12, rot: 18, scale: 1.25 },
			{ x: 70, y: 22, rot: -32, scale: 0.82 },
			{ x: 32, y: 34, rot: 42, scale: 1.35 },
			{ x: 74, y: 44, rot: -55, scale: 0.68 },
			{ x: 50, y: 18, rot: 65, scale: 0.28 },
			{ x: 42, y: 56, rot: 15, scale: 0.92 },
			{ x: 68, y: 68, rot: -28, scale: 1.3 },
			{ x: 22, y: 48, rot: -70, scale: 0.32 },
			{ x: 28, y: 78, rot: 50, scale: 0.62 },
			{ x: 62, y: 84, rot: -40, scale: 0.88 },
			{ x: 80, y: 60, rot: 35, scale: 0.36 },
			{ x: 44, y: 92, rot: 25, scale: 1.22 },
			{ x: 20, y: 26, rot: -15, scale: 0.75 },
			{ x: 55, y: 75, rot: 80, scale: 0.24 }
		],
		right: [
			{ x: 62, y: 12, rot: -18, scale: 1.25 },
			{ x: 30, y: 22, rot: 32, scale: 0.82 },
			{ x: 68, y: 34, rot: -42, scale: 1.35 },
			{ x: 26, y: 44, rot: 55, scale: 0.68 },
			{ x: 50, y: 18, rot: -65, scale: 0.28 },
			{ x: 58, y: 56, rot: -15, scale: 1.28 },
			{ x: 32, y: 68, rot: 28, scale: 0.88 },
			{ x: 78, y: 48, rot: 70, scale: 0.32 },
			{ x: 72, y: 78, rot: -50, scale: 0.62 },
			{ x: 38, y: 84, rot: 40, scale: 1.3 },
			{ x: 20, y: 60, rot: -35, scale: 0.36 },
			{ x: 56, y: 92, rot: -25, scale: 0.95 },
			{ x: 80, y: 26, rot: 15, scale: 0.75 },
			{ x: 45, y: 75, rot: -80, scale: 0.24 }
		]
	},

	// Projects: Structured grid with interlocking rotations (0°, 45°, 90°, 135°, 180°)
	projects: {
		left: [
			{ x: 62, y: 9, rot: 90, scale: 1.32 },
			{ x: 28, y: 18, rot: -45, scale: 0.85 },
			{ x: 72, y: 28, rot: 135, scale: 1.38 },
			{ x: 24, y: 38, rot: -90, scale: 0.7 },
			{ x: 48, y: 14, rot: 45, scale: 0.26 },
			{ x: 66, y: 48, rot: 0, scale: 0.95 },
			{ x: 30, y: 58, rot: -135, scale: 1.4 },
			{ x: 80, y: 42, rot: 90, scale: 0.34 },
			{ x: 68, y: 68, rot: 45, scale: 0.65 },
			{ x: 26, y: 76, rot: -90, scale: 0.88 },
			{ x: 42, y: 64, rot: 135, scale: 0.3 },
			{ x: 64, y: 86, rot: 180, scale: 1.25 },
			{ x: 22, y: 92, rot: -45, scale: 0.78 },
			{ x: 52, y: 80, rot: 0, scale: 0.24 }
		],
		right: [
			{ x: 38, y: 9, rot: -90, scale: 1.32 },
			{ x: 72, y: 18, rot: 45, scale: 0.85 },
			{ x: 28, y: 28, rot: -135, scale: 1.38 },
			{ x: 76, y: 38, rot: 90, scale: 0.7 },
			{ x: 52, y: 14, rot: -45, scale: 0.26 },
			{ x: 34, y: 48, rot: 0, scale: 1.28 },
			{ x: 70, y: 58, rot: 135, scale: 0.92 },
			{ x: 20, y: 42, rot: -90, scale: 0.34 },
			{ x: 32, y: 68, rot: -45, scale: 0.65 },
			{ x: 74, y: 76, rot: 90, scale: 1.35 },
			{ x: 58, y: 64, rot: -135, scale: 0.3 },
			{ x: 36, y: 86, rot: -180, scale: 0.95 },
			{ x: 78, y: 92, rot: 45, scale: 0.78 },
			{ x: 48, y: 80, rot: 0, scale: 0.24 }
		]
	},

	// Experiences: Ascending cascade (-90° / +90° ascending flow)
	experiences: {
		left: [
			{ x: 48, y: 8, rot: -90, scale: 1.25 },
			{ x: 32, y: 16, rot: -75, scale: 0.8 },
			{ x: 52, y: 24, rot: -90, scale: 1.35 },
			{ x: 68, y: 32, rot: -105, scale: 0.65 },
			{ x: 26, y: 20, rot: -90, scale: 0.28 },
			{ x: 44, y: 40, rot: -90, scale: 0.92 },
			{ x: 54, y: 49, rot: -90, scale: 1.42 },
			{ x: 72, y: 44, rot: -85, scale: 0.32 },
			{ x: 30, y: 58, rot: -95, scale: 0.6 },
			{ x: 58, y: 66, rot: -90, scale: 0.86 },
			{ x: 22, y: 62, rot: -90, scale: 0.35 },
			{ x: 46, y: 75, rot: -90, scale: 1.26 },
			{ x: 34, y: 85, rot: -80, scale: 0.76 },
			{ x: 64, y: 80, rot: -90, scale: 0.24 }
		],
		right: [
			{ x: 52, y: 8, rot: 90, scale: 1.25 },
			{ x: 68, y: 16, rot: 75, scale: 0.8 },
			{ x: 48, y: 24, rot: 90, scale: 1.35 },
			{ x: 32, y: 32, rot: 105, scale: 0.65 },
			{ x: 74, y: 20, rot: 90, scale: 0.28 },
			{ x: 56, y: 40, rot: 90, scale: 1.3 },
			{ x: 46, y: 49, rot: 90, scale: 0.88 },
			{ x: 28, y: 44, rot: 85, scale: 0.32 },
			{ x: 70, y: 58, rot: 95, scale: 0.6 },
			{ x: 42, y: 66, rot: 90, scale: 1.38 },
			{ x: 78, y: 62, rot: 90, scale: 0.35 },
			{ x: 54, y: 75, rot: 90, scale: 0.95 },
			{ x: 66, y: 85, rot: 80, scale: 0.76 },
			{ x: 36, y: 80, rot: 90, scale: 0.24 }
		]
	},

	// Contacts: Inward convergence guiding attention to the interaction center
	contacts: {
		left: [
			{ x: 58, y: 8, rot: 55, scale: 1.22 },
			{ x: 68, y: 17, rot: 42, scale: 0.85 },
			{ x: 78, y: 26, rot: 30, scale: 1.35 },
			{ x: 62, y: 35, rot: 20, scale: 0.68 },
			{ x: 42, y: 22, rot: 45, scale: 0.26 },
			{ x: 80, y: 44, rot: 10, scale: 0.94 },
			{ x: 85, y: 52, rot: 0, scale: 1.4 },
			{ x: 50, y: 48, rot: 5, scale: 0.34 },
			{ x: 76, y: 61, rot: -12, scale: 0.62 },
			{ x: 80, y: 70, rot: -25, scale: 0.9 },
			{ x: 46, y: 66, rot: -20, scale: 0.3 },
			{ x: 72, y: 80, rot: -38, scale: 1.28 },
			{ x: 56, y: 89, rot: -52, scale: 0.78 },
			{ x: 38, y: 76, rot: -35, scale: 0.24 }
		],
		right: [
			{ x: 42, y: 8, rot: -55, scale: 1.22 },
			{ x: 32, y: 17, rot: -42, scale: 0.85 },
			{ x: 22, y: 26, rot: -30, scale: 1.35 },
			{ x: 38, y: 35, rot: -20, scale: 0.68 },
			{ x: 58, y: 22, rot: -45, scale: 0.26 },
			{ x: 24, y: 44, rot: -10, scale: 1.28 },
			{ x: 15, y: 52, rot: 0, scale: 0.92 },
			{ x: 50, y: 48, rot: -5, scale: 0.34 },
			{ x: 24, y: 61, rot: 12, scale: 0.62 },
			{ x: 20, y: 70, rot: 25, scale: 1.38 },
			{ x: 54, y: 66, rot: 20, scale: 0.3 },
			{ x: 28, y: 80, rot: 38, scale: 0.95 },
			{ x: 44, y: 89, rot: 52, scale: 0.78 },
			{ x: 62, y: 76, rot: 35, scale: 0.24 }
		]
	}
};

export function getRouteLayoutKey(pathname: string): keyof typeof ROUTE_LAYOUTS {
	if (pathname.startsWith('/projects')) return 'projects';
	if (pathname.startsWith('/experiences')) return 'experiences';
	if (pathname.startsWith('/contacts')) return 'contacts';
	return 'home';
}
