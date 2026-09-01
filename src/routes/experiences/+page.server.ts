import { createSupabaseServerClient } from '$lib/supabase/server';
import type { Experience } from '$lib/types';
import type { PageServerLoad } from './$types';

const defaultExperiences: Experience[] = [
	{
		id: '1',
		period: '2023 — PRESENT',
		role: 'Software Developer',
		company: 'Freelance',
		description:
			'Building full-stack web applications with SvelteKit, TypeScript, and Supabase — from landing pages to admin dashboards and everything in between.',
		created_at: new Date().toISOString()
	},
	{
		id: '2',
		period: '2021 — PRESENT',
		role: 'Game Developer',
		company: 'Hobby Projects & Game Jams',
		description:
			'Prototyping game mechanics, building small playable demos, and learning the craft of game feel — one jam at a time.',
		created_at: new Date().toISOString()
	}
];

export const load: PageServerLoad = async ({ cookies }) => {
	try {
		const supabase = createSupabaseServerClient(cookies);
		const { data, error } = await supabase
			.from('experiences')
			.select('*')
			.order('order_num', { ascending: true })
			.order('created_at', { ascending: false });

		if (error || !data || data.length === 0) {
			return { experiences: defaultExperiences, error: error?.message ?? null };
		}
		return { experiences: data as Experience[], error: null };
	} catch {
		return { experiences: defaultExperiences, error: null };
	}
};
