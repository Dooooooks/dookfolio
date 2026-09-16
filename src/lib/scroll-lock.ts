let lockCount = 0;

export function lockScroll() {
	if (typeof document === 'undefined') return;
	lockCount++;
	if (lockCount === 1) {
		document.body.style.overflow = 'hidden';
	}
}

export function unlockScroll() {
	if (typeof document === 'undefined') return;
	lockCount = Math.max(0, lockCount - 1);
	if (lockCount === 0) {
		document.body.style.overflow = '';
	}
}

export function forceUnlockScroll() {
	if (typeof document === 'undefined') return;
	lockCount = 0;
	document.body.style.overflow = '';
}
