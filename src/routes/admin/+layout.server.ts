import { createSupabaseServerClient } from '$lib/supabase/server';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies }) => {
	try {
		const supabase = createSupabaseServerClient(cookies);
		const { data } = await supabase.auth.getUser();
		return { email: data.user?.email ?? null };
	} catch {
		return { email: null };
	}
};
