export const gameDevMode = $state({ clicks: 0, active: false });
export const reactionModal = $state({ open: false });

export function handleDuckClick() {
	if (gameDevMode.active) {
		gameDevMode.active = false;
		gameDevMode.clicks = 0;
	} else {
		gameDevMode.clicks += 1;
		if (gameDevMode.clicks >= 3) gameDevMode.active = true;
	}
}

export function openReactionModal() {
	reactionModal.open = true;
}

export function closeReactionModal() {
	reactionModal.open = false;
}
