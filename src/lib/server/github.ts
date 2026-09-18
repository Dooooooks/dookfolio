import { env } from '$env/dynamic/private';

export interface ContributionDay {
	date: string;
	count: number;
	level: 0 | 1 | 2 | 3 | 4;
}

export interface MonthLabel {
	name: string;
	colIndex: number;
}

export interface ContributionCalendar {
	total: number;
	year: string | number;
	weeks: Array<Array<ContributionDay | null>>;
	months: MonthLabel[];
}

// Fallback active contribution days across trailing year (e.g. Sep last year to Sep present)
const fallbackActiveDays: Array<{ date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }> = [
	{ date: '2025-10-15', count: 4, level: 3 },
	{ date: '2025-11-02', count: 6, level: 4 },
	{ date: '2025-12-20', count: 2, level: 2 },
	{ date: '2026-03-13', count: 3, level: 3 },
	{ date: '2026-03-14', count: 1, level: 1 },
	{ date: '2026-03-15', count: 3, level: 3 },
	{ date: '2026-03-16', count: 4, level: 4 },
	{ date: '2026-09-01', count: 2, level: 2 },
	{ date: '2026-09-02', count: 7, level: 4 },
	{ date: '2026-09-07', count: 1, level: 1 },
	{ date: '2026-09-08', count: 22, level: 4 },
	{ date: '2026-09-09', count: 10, level: 4 }
];

function getDefaultTrailingDateRange(): { startDate: string; endDate: string } {
	const now = new Date();
	const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
	const endDate = todayUTC.toISOString().slice(0, 10);

	// Trailing 365-day rolling window ending today:
	// As each new day is added in the present, a day is removed from the beginning.
	const startUTC = new Date(todayUTC.getTime() - 364 * 24 * 60 * 60 * 1000);
	const startDate = startUTC.toISOString().slice(0, 10);

	return { startDate, endDate };
}

export function buildContributionCalendar(
	contributions: Array<{ date: string; count: number; level: number }>,
	yearOrPeriod: string | number = 'the last year',
	totalCount?: number,
	options?: { startDate?: string; endDate?: string }
): ContributionCalendar {
	const map = new Map<string, { count: number; level: 0 | 1 | 2 | 3 | 4 }>();
	let calculatedTotal = 0;

	for (const c of contributions) {
		const lvl = Math.min(4, Math.max(0, Math.round(c.level))) as 0 | 1 | 2 | 3 | 4;
		map.set(c.date, { count: c.count, level: lvl });
		calculatedTotal += c.count;
	}

	const fallbackRange = getDefaultTrailingDateRange();
	const endDateStr =
		options?.endDate ??
		(contributions.length > 0 ? contributions[contributions.length - 1].date : fallbackRange.endDate);

	// Dynamically calculate 365-day rolling window ending at endDateStr:
	// When a day is added in the present month, a day is removed in the 1st month.
	const end = new Date(endDateStr + 'T00:00:00Z');
	const rollingStart = new Date(end.getTime() - 364 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
	const startDateStr = options?.startDate ?? rollingStart;
	const start = new Date(startDateStr + 'T00:00:00Z');

	const weeks: Array<Array<ContributionDay | null>> = [];
	let currentWeek: Array<ContributionDay | null> = [];

	// Sunday is 0, Monday is 1, ..., Saturday is 6
	const startDow = start.getUTCDay();
	for (let i = 0; i < startDow; i++) {
		currentWeek.push(null);
	}

	const months: MonthLabel[] = [];
	let lastMonth = -1;

	const d = new Date(start);
	while (d <= end) {
		const dateStr = d.toISOString().slice(0, 10);
		const m = d.getUTCMonth();
		if (m !== lastMonth) {
			const colIndex = weeks.length;
			months.push({
				name: d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
				colIndex
			});
			lastMonth = m;
		}

		const entry = map.get(dateStr);
		currentWeek.push({
			date: dateStr,
			count: entry ? entry.count : 0,
			level: entry ? entry.level : 0
		});

		if (currentWeek.length === 7) {
			weeks.push(currentWeek);
			currentWeek = [];
		}
		d.setUTCDate(d.getUTCDate() + 1);
	}

	if (currentWeek.length > 0) {
		while (currentWeek.length < 7) {
			currentWeek.push(null);
		}
		weeks.push(currentWeek);
	}

	// Dynamic 1st month collision removal:
	// If the 1st month label is touching/too close to the 2nd month label (< 3 columns apart, ~39px),
	// remove the 1st month label so they never touch as the window rolls day by day.
	if (months.length > 1 && months[1].colIndex - months[0].colIndex < 3) {
		months.shift();
	}

	return {
		total: totalCount ?? calculatedTotal,
		year: yearOrPeriod,
		weeks,
		months
	};
}

let contributionsCache: { data: ContributionCalendar; timestamp: number } | null = null;
const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes cache

async function fetchGraphQLContributions(
	token: string
): Promise<ContributionCalendar | null> {
	const query = `
		query($username: String!) {
			user(login: $username) {
				contributionsCollection {
					contributionCalendar {
						totalContributions
						weeks {
							contributionDays {
								date
								contributionCount
								contributionLevel
							}
						}
					}
				}
			}
		}
	`;

	const res = await fetch('https://api.github.com/graphql', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'User-Agent': 'Dookfolio',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			query,
			variables: {
				username: 'Dooooooks'
			}
		})
	});

	if (!res.ok) return null;

	const json = (await res.json()) as {
		data?: {
			user?: {
				contributionsCollection?: {
					contributionCalendar?: {
						totalContributions: number;
						weeks: Array<{
							contributionDays: Array<{
								date: string;
								contributionCount: number;
								contributionLevel:
									| 'NONE'
									| 'FIRST_QUARTILE'
									| 'SECOND_QUARTILE'
									| 'THIRD_QUARTILE'
									| 'FOURTH_QUARTILE';
							}>;
						}>;
					};
				};
			};
		};
		errors?: unknown[];
	};

	if (json.errors || !json.data?.user?.contributionsCollection?.contributionCalendar) {
		return null;
	}

	const calendar = json.data.user.contributionsCollection.contributionCalendar;
	const levelMap: Record<string, 0 | 1 | 2 | 3 | 4> = {
		NONE: 0,
		FIRST_QUARTILE: 1,
		SECOND_QUARTILE: 2,
		THIRD_QUARTILE: 3,
		FOURTH_QUARTILE: 4
	};

	const rawContributions: Array<{ date: string; count: number; level: number }> = [];
	for (const week of calendar.weeks) {
		for (const day of week.contributionDays) {
			rawContributions.push({
				date: day.date,
				count: day.contributionCount,
				level: levelMap[day.contributionLevel] ?? 0
			});
		}
	}

	return buildContributionCalendar(rawContributions, 'the last year', calendar.totalContributions);
}

export async function getGithubContributions(): Promise<ContributionCalendar> {
	if (contributionsCache && Date.now() - contributionsCache.timestamp < CACHE_TTL_MS) {
		return contributionsCache.data;
	}

	// 1. If GITHUB_TOKEN is available, query official GitHub GraphQL API (trailing year)
	const token = env.GITHUB_TOKEN;
	if (token) {
		try {
			const gqlCalendar = await fetchGraphQLContributions(token);
			if (gqlCalendar) {
				contributionsCache = { data: gqlCalendar, timestamp: Date.now() };
				return gqlCalendar;
			}
		} catch {
			// Fallback to standard provider on GraphQL error
		}
	}

	// 2. Query contributions endpoint with y=last for the trailing year
	try {
		const res = await fetch('https://github-contributions-api.jogruber.de/v4/Dooooooks?y=last', {
			headers: {
				'User-Agent': 'Dookfolio'
			}
		});

		if (res.ok) {
			const data = (await res.json()) as {
				total?: { [key: string]: number };
				contributions?: Array<{ date: string; count: number; level: number }>;
			};

			const list = data.contributions || [];
			const total = data.total?.['lastYear'] ?? data.total?.[Object.keys(data.total || {})[0]] ?? 399;
			const calendar = buildContributionCalendar(list, 'the last year', total);

			contributionsCache = { data: calendar, timestamp: Date.now() };
			return calendar;
		}
	} catch {
		// Fallback to offline data
	}

	// 3. Resilient offline fallback across trailing year
	const fallback = buildContributionCalendar(fallbackActiveDays, 'the last year', 399);
	return contributionsCache?.data ?? fallback;
}
