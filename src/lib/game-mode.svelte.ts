export const gameDevMode = $state({ clicks: 0, fedCount: 0, quacks: 0, active: false });
export const reactionModal = $state({ open: false });
export const breakContractModal = $state({ open: false });
export const shopModal = $state({ open: false });

export interface UpgradesState {
	strongerQuack: number;
	luckyQuack: number;
	heavyQuack: number;
	quackCombo: number;
	speedyBill: number;
	goldenCrumbs: number;
	scavengerDuck: number;
}

export interface UpgradeConfig {
	id: keyof UpgradesState;
	name: string;
	description: string;
	costs: [number, number, number, number, number];
}

export const UPGRADE_CONFIGS: Record<keyof UpgradesState, UpgradeConfig> = {
	strongerQuack: {
		id: 'strongerQuack',
		name: 'Stronger Quack',
		description: '+1 flat value per click',
		costs: [50, 175, 550, 1600, 4500]
	},
	luckyQuack: {
		id: 'luckyQuack',
		name: 'Lucky Quack',
		description: '+10% critical strike chance',
		costs: [100, 320, 950, 2800, 7500]
	},
	heavyQuack: {
		id: 'heavyQuack',
		name: 'Heavy Quack',
		description: '+1x critical power multiplier',
		costs: [150, 500, 1500, 4200, 12000]
	},
	quackCombo: {
		id: 'quackCombo',
		name: 'Quack Combo',
		description: 'Frenzy meter for up to +100% quacks & crits',
		costs: [75, 250, 750, 2200, 6000]
	},
	speedyBill: {
		id: 'speedyBill',
		name: 'Speedy Bill',
		description: 'Faster click recovery for ultra-rapid clicking',
		costs: [60, 200, 600, 1800, 5000]
	},
	goldenCrumbs: {
		id: 'goldenCrumbs',
		name: 'Golden Crumb Drops',
		description: 'Rare golden crumbs granting bursts or 3x boosts',
		costs: [120, 400, 1200, 3500, 9500]
	},
	scavengerDuck: {
		id: 'scavengerDuck',
		name: 'Scavenger Duck',
		description: 'Increases golden crumb spawn frequency & rewards',
		costs: [180, 550, 1600, 4500, 13000]
	}
};

export const upgrades = $state<UpgradesState>({
	strongerQuack: 0,
	luckyQuack: 0,
	heavyQuack: 0,
	quackCombo: 0,
	speedyBill: 0,
	goldenCrumbs: 0,
	scavengerDuck: 0
});

// Combo & Frenzy System State
export const combo = $state({
	meter: 0, // 0 - 100
	active: false,
	multiplier: 1,
	isGuaranteedCrit: false
});

// Golden Breadcrumb Boost State
export const goldenBoost = $state({
	active: false,
	multiplier: 3,
	remainingSeconds: 0
});

export function registerDuckClickCombo() {
	if (upgrades.quackCombo <= 0) return;
	combo.meter = Math.min(100, combo.meter + 16);
	updateComboStatus();
}

export function updateComboStatus() {
	if (upgrades.quackCombo <= 0 || combo.meter < 30) {
		combo.multiplier = 1;
		combo.isGuaranteedCrit = false;
		combo.active = false;
		return;
	}

	combo.active = true;
	if (combo.meter >= 80) {
		// Tier 2 (80%+): +20% per combo level (up to +100% at lvl 5), guaranteed crits at level 5
		combo.multiplier = 1 + upgrades.quackCombo * 0.2;
		combo.isGuaranteedCrit = upgrades.quackCombo >= 5;
	} else {
		// Tier 1 (30-79%): +10% per combo level (up to +50% at lvl 5)
		combo.multiplier = 1 + upgrades.quackCombo * 0.1;
		combo.isGuaranteedCrit = false;
	}
}

export function decayCombo(amount = 2.5) {
	if (combo.meter > 0) {
		combo.meter = Math.max(0, combo.meter - amount);
		updateComboStatus();
	}
}

export function triggerGoldenBoost(seconds: number, multiplier = 3) {
	goldenBoost.active = true;
	goldenBoost.multiplier = multiplier;
	goldenBoost.remainingSeconds = seconds;
}

export function tickGoldenBoost() {
	if (goldenBoost.active) {
		goldenBoost.remainingSeconds -= 1;
		if (goldenBoost.remainingSeconds <= 0) {
			goldenBoost.active = false;
		}
	}
}

export function openShopModal() {
	shopModal.open = true;
}

export function closeShopModal() {
	shopModal.open = false;
}

export function getUpgradeCost(id: keyof UpgradesState): number | null {
	const currentLevel = upgrades[id];
	if (currentLevel >= 5) return null;
	return UPGRADE_CONFIGS[id].costs[currentLevel];
}

export function buyUpgrade(id: keyof UpgradesState): boolean {
	const cost = getUpgradeCost(id);
	if (cost === null) return false;
	if (gameDevMode.quacks < cost) return false;

	gameDevMode.quacks -= cost;
	upgrades[id] += 1;
	return true;
}

export interface DuckClickResult {
	earned: number;
	isCrit: boolean;
	multiplier: number;
	isComboActive: boolean;
	isGoldenActive: boolean;
}

export function calculateDuckClick(): DuckClickResult {
	registerDuckClickCombo();

	// Base damage: 1 flat + shop strongerQuack level (0-5) + breadcrumbs bonus (0-5 from fedCount)
	const baseDamage = 1 + upgrades.strongerQuack + gameDevMode.fedCount;
	const critChance = upgrades.luckyQuack * 0.1;
	const isCrit = combo.isGuaranteedCrit || Math.random() < critChance;
	const critMultiplier = isCrit ? 2 + upgrades.heavyQuack : 1;
	const comboMultiplier = combo.multiplier;
	const boostMultiplier = goldenBoost.active ? goldenBoost.multiplier : 1;

	const totalMultiplier = critMultiplier * comboMultiplier * boostMultiplier;
	const earned = Math.max(1, Math.round(baseDamage * totalMultiplier));

	gameDevMode.quacks += earned;
	return {
		earned,
		isCrit,
		multiplier: totalMultiplier,
		isComboActive: combo.active,
		isGoldenActive: goldenBoost.active
	};
}

export function feedDuck(): number {
	if (gameDevMode.fedCount < 5) {
		gameDevMode.fedCount += 1;
		if (gameDevMode.fedCount >= 5) {
			gameDevMode.active = true;
		}
		return gameDevMode.fedCount;
	}
	return 5;
}

export function handleDuckClick(): DuckClickResult {
	return calculateDuckClick();
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
	combo.meter = 0;
	combo.active = false;
	combo.multiplier = 1;
	combo.isGuaranteedCrit = false;
	goldenBoost.active = false;
	goldenBoost.remainingSeconds = 0;
	// quacks score and shop upgrades are preserved until site refresh
	breakContractModal.open = false;
}

export function openReactionModal() {
	reactionModal.open = true;
}

export function closeReactionModal() {
	reactionModal.open = false;
}
