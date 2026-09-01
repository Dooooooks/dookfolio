import { createSupabaseServerClient } from '$lib/supabase/server';
import type { Project } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	try {
		const supabase = createSupabaseServerClient(cookies);
		const { data, error } = await supabase
			.from('projects')
			.select('*')
			.order('created_at', { ascending: false });

		if (error) return { projects: [] as Project[], error: error.message };
		return { projects: (data ?? []) as Project[] };
	} catch {
		return {
			projects: [] as Project[],
			error:
				'Supabase is not configured. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY in .env'
		};
	}
};
