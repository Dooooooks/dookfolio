let lockCount = 0;
let previousPaddingRight = '';

export function lockScroll() {
	if (typeof document === 'undefined') return;
	lockCount++;
	if (lockCount === 1) {
		const supportsScrollbarGutter =
			typeof CSS !== 'undefined' &&
			typeof CSS.supports === 'function' &&
			CSS.supports('scrollbar-gutter', 'stable');

		if (!supportsScrollbarGutter) {
			const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
			previousPaddingRight = document.body.style.paddingRight;
			if (scrollbarWidth > 0) {
				document.body.style.paddingRight = `${scrollbarWidth}px`;
			}
		}

		document.body.style.overflow = 'hidden';
	}
}

export function unlockScroll() {
	if (typeof document === 'undefined') return;
	lockCount = Math.max(0, lockCount - 1);
	if (lockCount === 0) {
		document.body.style.overflow = '';
		if (previousPaddingRight !== '') {
			document.body.style.paddingRight = previousPaddingRight;
			previousPaddingRight = '';
		} else {
			document.body.style.paddingRight = '';
		}
	}
}

export function forceUnlockScroll() {
	if (typeof document === 'undefined') return;
	lockCount = 0;
	document.body.style.overflow = '';
	if (previousPaddingRight !== '') {
		document.body.style.paddingRight = previousPaddingRight;
		previousPaddingRight = '';
	} else {
		document.body.style.paddingRight = '';
	}
}
