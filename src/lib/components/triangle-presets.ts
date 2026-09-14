export interface ShardTransform {
	x: number; // percentage (0 - 100)
	y: number; // percentage (0 - 100)
	rot: number; // degrees
	scale: number;
}

export interface ShardDefinition {
	id: string;
	variant: 'equilateral' | 'acute' | 'wide';
	animClass: string;
	delay: string;
	fill: string;
	stroke: string;
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

// Mathematically symmetrical, pixel-perfect 8-bit stepped shapes
export const SHARD_BASE_SHAPES = {
	equilateral: {
		smooth: '0,-32 66,36 -66,36',
		pixel:
			'M -2,-32 H 2 V -28 H 6 V -24 H 10 V -20 H 14 V -16 H 18 V -12 H 22 V -8 H 26 V -4 H 30 V 0 H 34 V 4 H 38 V 8 H 42 V 12 H 46 V 16 H 50 V 20 H 54 V 24 H 58 V 28 H 62 V 32 H 66 V 36 H -66 V 32 H -62 V 28 H -58 V 24 H -54 V 20 H -50 V 16 H -46 V 12 H -42 V 8 H -38 V 4 H -34 V 0 H -30 V -4 H -26 V -8 H -22 V -12 H -18 V -16 H -14 V -20 H -10 V -24 H -6 V -28 H -2 Z'
	},
	acute: {
		smooth: '0,-36 38,40 -38,40',
		pixel:
			'M -2,-36 H 2 V -28 H 6 V -20 H 10 V -12 H 14 V -4 H 18 V 4 H 22 V 12 H 26 V 20 H 30 V 28 H 34 V 36 H 38 V 40 H -38 V 36 H -34 V 28 H -30 V 20 H -26 V 12 H -22 V 4 H -18 V -4 H -14 V -12 H -10 V -20 H -6 V -28 H -2 Z'
	},
	wide: {
		smooth: '0,-24 68,28 -68,28',
		pixel:
			'M -4,-24 H 4 V -18 H 12 V -12 H 20 V -6 H 28 V 0 H 36 V 6 H 44 V 12 H 52 V 18 H 60 V 24 H 68 V 28 H -68 V 24 H -60 V 18 H -52 V 12 H -44 V 6 H -36 V 0 H -28 V -6 H -20 V -12 H -12 V -18 H -4 Z'
	}
};

export const LEFT_SHARDS: ShardDefinition[] = [
	{
		id: 'shard-l-0',
		variant: 'equilateral',
		animClass: 'anim-shard-float-1',
		delay: '0s',
		fill: PALETTE.fillGrad1,
		stroke: PALETTE.stroke
	},
	{
		id: 'shard-l-1',
		variant: 'acute',
		animClass: 'anim-shard-float-2',
		delay: '0.8s',
		fill: PALETTE.fillSolid,
		stroke: PALETTE.strokeSoft
	},
	{
		id: 'shard-l-2',
		variant: 'wide',
		animClass: 'anim-shard-float-3',
		delay: '1.4s',
		fill: PALETTE.fillGrad2,
		stroke: PALETTE.stroke
	},
	{
		id: 'shard-l-3',
		variant: 'equilateral',
		animClass: 'anim-shard-float-1',
		delay: '2.1s',
		fill: PALETTE.fillSolid,
		stroke: PALETTE.strokeSoft
	},
	{
		id: 'shard-l-4',
		variant: 'acute',
		animClass: 'anim-shard-float-2',
		delay: '1.1s',
		fill: PALETTE.fillGrad1,
		stroke: PALETTE.stroke
	}
];

export const RIGHT_SHARDS: ShardDefinition[] = [
	{
		id: 'shard-r-0',
		variant: 'equilateral',
		animClass: 'anim-shard-float-2',
		delay: '0.4s',
		fill: PALETTE.fillGrad2,
		stroke: PALETTE.stroke
	},
	{
		id: 'shard-r-1',
		variant: 'wide',
		animClass: 'anim-shard-float-3',
		delay: '1.2s',
		fill: PALETTE.fillSolid,
		stroke: PALETTE.strokeSoft
	},
	{
		id: 'shard-r-2',
		variant: 'acute',
		animClass: 'anim-shard-float-1',
		delay: '0.2s',
		fill: PALETTE.fillGrad1,
		stroke: PALETTE.stroke
	},
	{
		id: 'shard-r-3',
		variant: 'equilateral',
		animClass: 'anim-shard-float-2',
		delay: '1.8s',
		fill: PALETTE.fillGrad2,
		stroke: PALETTE.strokeSoft
	},
	{
		id: 'shard-r-4',
		variant: 'wide',
		animClass: 'anim-shard-float-3',
		delay: '0.9s',
		fill: PALETTE.fillSolid,
		stroke: PALETTE.stroke
	}
];

// Layout & Rotations per route (using percentage coordinates for un-stretched, resolution-independent positioning)
export const ROUTE_LAYOUTS: Record<string, RouteLayout> = {
	// Home: Floating ambient dispersion with relaxed organic angles
	home: {
		left: [
			{ x: 35, y: 12, rot: 15, scale: 1.0 },
			{ x: 65, y: 30, rot: -35, scale: 0.9 },
			{ x: 30, y: 50, rot: 40, scale: 1.15 },
			{ x: 70, y: 70, rot: -25, scale: 0.9 },
			{ x: 40, y: 88, rot: 30, scale: 1.05 }
		],
		right: [
			{ x: 65, y: 12, rot: -15, scale: 1.0 },
			{ x: 35, y: 30, rot: 35, scale: 0.9 },
			{ x: 70, y: 50, rot: -40, scale: 1.15 },
			{ x: 30, y: 70, rot: 25, scale: 0.9 },
			{ x: 60, y: 88, rot: -30, scale: 1.05 }
		]
	},

	// Projects: Sharp technical rotations (90°, -80°, 135°, -125°) and structural interlocking
	projects: {
		left: [
			{ x: 65, y: 10, rot: 90, scale: 1.1 },
			{ x: 25, y: 28, rot: -80, scale: 0.95 },
			{ x: 70, y: 48, rot: 135, scale: 1.2 },
			{ x: 30, y: 68, rot: -125, scale: 0.88 },
			{ x: 65, y: 86, rot: 175, scale: 1.05 }
		],
		right: [
			{ x: 35, y: 10, rot: -90, scale: 1.1 },
			{ x: 75, y: 28, rot: 80, scale: 0.95 },
			{ x: 30, y: 48, rot: -135, scale: 1.2 },
			{ x: 70, y: 68, rot: 125, scale: 0.88 },
			{ x: 35, y: 86, rot: -175, scale: 1.05 }
		]
	},

	// Experiences: Aligned vertical ladder / ascending chevron column with uniform upward tilt
	experiences: {
		left: [
			{ x: 45, y: 14, rot: -90, scale: 0.9 },
			{ x: 45, y: 32, rot: -90, scale: 1.0 },
			{ x: 45, y: 50, rot: -90, scale: 1.15 },
			{ x: 45, y: 68, rot: -90, scale: 1.0 },
			{ x: 45, y: 86, rot: -90, scale: 0.95 }
		],
		right: [
			{ x: 55, y: 14, rot: 90, scale: 0.9 },
			{ x: 55, y: 32, rot: 90, scale: 1.0 },
			{ x: 55, y: 50, rot: 90, scale: 1.15 },
			{ x: 55, y: 68, rot: 90, scale: 1.0 },
			{ x: 55, y: 86, rot: 90, scale: 0.95 }
		]
	},

	// Contacts: Inward-pointing focal arrows guiding attention to central interaction area
	contacts: {
		left: [
			{ x: 60, y: 12, rot: 45, scale: 1.0 },
			{ x: 75, y: 31, rot: 25, scale: 1.1 },
			{ x: 82, y: 50, rot: 0, scale: 1.25 },
			{ x: 75, y: 69, rot: -25, scale: 1.1 },
			{ x: 60, y: 88, rot: -45, scale: 1.0 }
		],
		right: [
			{ x: 40, y: 12, rot: -45, scale: 1.0 },
			{ x: 25, y: 31, rot: -25, scale: 1.1 },
			{ x: 18, y: 50, rot: 0, scale: 1.25 },
			{ x: 25, y: 69, rot: 25, scale: 1.1 },
			{ x: 40, y: 88, rot: 45, scale: 1.0 }
		]
	}
};

export function getRouteLayoutKey(pathname: string): keyof typeof ROUTE_LAYOUTS {
	if (pathname.startsWith('/projects')) return 'projects';
	if (pathname.startsWith('/experiences')) return 'experiences';
	if (pathname.startsWith('/contacts')) return 'contacts';
	return 'home';
}
