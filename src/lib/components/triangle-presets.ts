export type ShardVariant = 'equilateral' | 'acute' | 'wide' | 'splinter' | 'scalene' | 'chip';
export type DepthLayer = 'bg' | 'mg' | 'fg';

export interface ShardTransform {
	x: number; // percentage (0 - 100)
	y: number; // percentage (0 - 100)
	rot: number; // degrees
	scale: number;
}

export interface ShardDefinition {
	id: string;
	variant: ShardVariant;
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

// Mathematically symmetrical, pixel-perfect 8-bit stepped triangle
export const PERFECT_PIXEL_TRIANGLE =
	'M -2,-32 H 2 V -28 H 6 V -24 H 10 V -20 H 14 V -16 H 18 V -12 H 22 V -8 H 26 V -4 H 30 V 0 H 34 V 4 H 38 V 8 H 42 V 12 H 46 V 16 H 50 V 20 H 54 V 24 H 58 V 28 H 62 V 32 H 66 V 36 H -66 V 32 H -62 V 28 H -58 V 24 H -54 V 20 H -50 V 16 H -46 V 12 H -42 V 8 H -38 V 4 H -34 V 0 H -30 V -4 H -26 V -8 H -22 V -12 H -18 V -16 H -14 V -20 H -10 V -24 H -6 V -28 H -2 Z';

// Mathematically symmetrical & razor-angled broken glass shapes with pixel-perfect 8-bit stepped equivalents
export const SHARD_BASE_SHAPES: Record<
	ShardVariant,
	{
		smooth: string;
		pixel: string;
	}
> = {
	// Balanced faceted plate
	equilateral: {
		smooth: '0,-32 66,36 -66,36',
		pixel: PERFECT_PIXEL_TRIANGLE
	},
	// Tall needle shard
	acute: {
		smooth: '0,-36 38,40 -38,40',
		pixel: PERFECT_PIXEL_TRIANGLE
	},
	// Wide wedge shard
	wide: {
		smooth: '0,-24 68,28 -68,28',
		pixel: PERFECT_PIXEL_TRIANGLE
	},
	// Razor-thin glass sliver / splinter
	splinter: {
		smooth: '0,-44 14,44 -14,44',
		pixel: PERFECT_PIXEL_TRIANGLE
	},
	// Sheared asymmetric fracture shard
	scalene: {
		smooth: '-18,-38 52,32 -44,38',
		pixel: PERFECT_PIXEL_TRIANGLE
	},
	// Micro crystal chip / dust spark
	chip: {
		smooth: '0,-20 24,18 -24,18',
		pixel: PERFECT_PIXEL_TRIANGLE
	}
};

// 14 Left Flank Shards with 3 Depth Tiers (Foreground, Midground, Background)
export const LEFT_SHARDS: ShardDefinition[] = [
	{
		id: 'shard-l-0',
		variant: 'equilateral',
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
		variant: 'acute',
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
		variant: 'scalene',
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
		variant: 'splinter',
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
		variant: 'chip',
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
		variant: 'wide',
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
		variant: 'acute',
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
		variant: 'chip',
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
		variant: 'splinter',
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
		variant: 'scalene',
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
		variant: 'chip',
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
		variant: 'wide',
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
		variant: 'acute',
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
		variant: 'chip',
		layer: 'bg',
		animClass: 'anim-shard-float-5',
		delay: '3.1s',
		fill: PALETTE.fillSolid,
		stroke: PALETTE.strokeSoft,
		strokeWidth: 1.0,
		opacity: 0.38
	}
];

// 14 Right Flank Shards with 3 Depth Tiers (Foreground, Midground, Background)
export const RIGHT_SHARDS: ShardDefinition[] = [
	{
		id: 'shard-r-0',
		variant: 'scalene',
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
		variant: 'wide',
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
		variant: 'splinter',
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
		variant: 'acute',
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
		variant: 'chip',
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
		variant: 'equilateral',
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
		variant: 'scalene',
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
		variant: 'chip',
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
		variant: 'splinter',
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
		variant: 'acute',
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
		variant: 'chip',
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
		variant: 'wide',
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
		variant: 'scalene',
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
		variant: 'chip',
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
	// Home: Radiating shattered glass constellation with organic drift and dramatic scale range (0.24 to 1.35)
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

	// Projects: Sharp technical fractured lattice with structural interlocking rotations (0°, 45°, 90°, 135°, 180°)
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

	// Experiences: Ascending crystalline cascade / vertical fracture ladder (-90° / +90° ascending flow)
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

	// Contacts: Shattered convergence / inward-pointing focal arrows guiding attention to interaction center
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
