export const gameDevMode = $state({ clicks: 0, fedCount: 0, active: false });
export const reactionModal = $state({ open: false });
export const breakContractModal = $state({ open: false });

export function feedDuck(): number {
	if (gameDevMode.fedCount < 3) {
		gameDevMode.fedCount += 1;
		if (gameDevMode.fedCount >= 3) {
			gameDevMode.active = true;
		}
		return gameDevMode.fedCount;
	}
	return 3;
}

export function handleDuckClick() {
	if (gameDevMode.active) {
		openBreakContractModal();
	}
}

export function openBreakContractModal() {
	breakContractModal.open = true;
}

export function closeBreakContractModal() {
	breakContractModal.open = false;
}

export function confirmBreakContract() {
	gameDevMode.active = false;
	gameDevMode.fedCount = 0;
	gameDevMode.clicks = 0;
	breakContractModal.open = false;
}

export function openReactionModal() {
	reactionModal.open = true;
}

export function closeReactionModal() {
	reactionModal.open = false;
}
