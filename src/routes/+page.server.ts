import { getGithubContributions } from '$lib/server/github';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const contributions = await getGithubContributions();

	return {
		contributions
	};
};
