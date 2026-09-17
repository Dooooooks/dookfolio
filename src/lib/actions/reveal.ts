import type { Action } from 'svelte/action';

export interface RevealOptions {
	/** Delay in milliseconds before reveal animation starts (default: 0) */
	delay?: number;
	/** Animation duration in milliseconds (default: 650) */
	duration?: number;
	/** Vertical displacement in pixels (default: 28) */
	y?: number;
	/** Starting scale (default: 0.95 for pop-up feel) */
	scale?: number;
	/**
	 * Custom mode: when true, skips default .reveal-pop styles and only
	 * manages reveal state, allowing custom component-level CSS transforms.
	 */
	custom?: boolean;
	/** Whether the reveal triggers only once upon entering viewport (default: true) */
	once?: boolean;
	/** Root margin for IntersectionObserver (default: '0px 0px -40px 0px') */
	rootMargin?: string;
	/** Intersection threshold (default: 0.08) */
	threshold?: number;
	/** Optional callback when the element is revealed */
	onReveal?: (node: HTMLElement) => void;
}

interface StoredConfig {
	options: RevealOptions;
	cleanupTimeout?: ReturnType<typeof setTimeout>;
	mutationObserver?: MutationObserver;
}

const nodeConfigs = new WeakMap<HTMLElement, StoredConfig>();
let defaultObserver: IntersectionObserver | null = null;

function handleIntersect(entry: IntersectionObserverEntry, observer: IntersectionObserver) {
	if (!entry.isIntersecting) return;

	const node = entry.target as HTMLElement;
	const config = nodeConfigs.get(node);
	const opts = config?.options ?? {};

	const delay = opts.delay ?? 0;
	const duration = opts.duration ?? 650;

	// Trigger reveal in both dataset (immune to Svelte class rewrites) and classList
	node.dataset.revealed = 'true';
	node.classList.add('is-revealed');
	opts.onReveal?.(node);

	// For default reveal-pop, cleanly release the transform lock after animation finishes
	// so that hover, active, and focus transformations operate freely without CSS conflicts.
	if (!opts.custom) {
		const totalTime = delay + duration + 60;
		if (config) {
			config.cleanupTimeout = setTimeout(() => {
				node.dataset.completed = 'true';
				node.classList.add('reveal-completed');
			}, totalTime);
		}
	}

	if (opts.once !== false) {
		observer.unobserve(node);
	}
}

function getDefaultObserver(): IntersectionObserver {
	if (!defaultObserver && typeof window !== 'undefined') {
		defaultObserver = new IntersectionObserver(
			(entries, observer) => {
				for (const entry of entries) {
					handleIntersect(entry, observer);
				}
			},
			{
				rootMargin: '0px 0px -40px 0px',
				threshold: 0.08
			}
		);
	}
	return defaultObserver!;
}

/**
 * Svelte Action: `use:reveal`
 *
 * Provides smooth, performant scroll-triggered reveal & pop-up animations
 * using a shared IntersectionObserver. Immune to Svelte reactive class overwrites.
 */
export const reveal: Action<HTMLElement, RevealOptions | undefined> = (node, initialOptions = {}) => {
	if (typeof window === 'undefined') return;

	// Respect user accessibility preference
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		node.dataset.revealed = 'true';
		node.dataset.completed = 'true';
		node.classList.add('is-revealed', 'reveal-completed');
		initialOptions.onReveal?.(node);
		return;
	}

	let options = { ...initialOptions };
	const isCustom = !!options.custom;
	const delay = options.delay ?? 0;
	const duration = options.duration ?? 650;
	const y = options.y ?? 28;
	const scale = options.scale ?? 0.95;

	node.dataset.reveal = isCustom ? 'custom' : 'pop';

	if (!isCustom) {
		node.classList.add('reveal-pop');
		node.style.setProperty('--reveal-delay', `${delay}ms`);
		node.style.setProperty('--reveal-duration', `${duration}ms`);
		node.style.setProperty('--reveal-y', `${y}px`);
		node.style.setProperty('--reveal-scale', `${scale}`);
	}

	// Svelte reactive templates may rewrite className on state changes (such as hover).
	// The MutationObserver ensures is-revealed and reveal-pop remain present if Svelte re-renders.
	let mutationObserver: MutationObserver | undefined;
	if (typeof MutationObserver !== 'undefined') {
		mutationObserver = new MutationObserver(() => {
			if (node.dataset.revealed === 'true' && !node.classList.contains('is-revealed')) {
				node.classList.add('is-revealed');
			}
			if (!options.custom && !node.classList.contains('reveal-pop')) {
				node.classList.add('reveal-pop');
			}
			if (node.dataset.completed === 'true' && !node.classList.contains('reveal-completed')) {
				node.classList.add('reveal-completed');
			}
		});
		mutationObserver.observe(node, { attributes: true, attributeFilter: ['class'] });
	}

	const stored: StoredConfig = { options, mutationObserver };
	nodeConfigs.set(node, stored);

	let activeObserver: IntersectionObserver;
	if (options.rootMargin || (options.threshold !== undefined && options.threshold !== 0.08)) {
		activeObserver = new IntersectionObserver(
			(entries, obs) => {
				for (const entry of entries) {
					handleIntersect(entry, obs);
				}
			},
			{
				rootMargin: options.rootMargin || '0px 0px -40px 0px',
				threshold: options.threshold ?? 0.08
			}
		);
	} else {
		activeObserver = getDefaultObserver();
	}

	activeObserver.observe(node);

	return {
		update(newOptions = {}) {
			options = { ...newOptions };
			const conf = nodeConfigs.get(node);
			if (conf) {
				conf.options = options;
			}
			if (!options.custom) {
				if (options.delay !== undefined) {
					node.style.setProperty('--reveal-delay', `${options.delay}ms`);
				}
				if (options.duration !== undefined) {
					node.style.setProperty('--reveal-duration', `${options.duration}ms`);
				}
				if (options.y !== undefined) {
					node.style.setProperty('--reveal-y', `${options.y}px`);
				}
				if (options.scale !== undefined) {
					node.style.setProperty('--reveal-scale', `${options.scale}`);
				}
			}
		},
		destroy() {
			const conf = nodeConfigs.get(node);
			if (conf?.cleanupTimeout) {
				clearTimeout(conf.cleanupTimeout);
			}
			if (conf?.mutationObserver) {
				conf.mutationObserver.disconnect();
			}
			nodeConfigs.delete(node);
			activeObserver.unobserve(node);
		}
	};
};
