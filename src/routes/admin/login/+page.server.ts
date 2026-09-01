import { createSupabaseServerClient } from '$lib/supabase/server';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim();
		const password = String(formData.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required.', email });
		}

		try {
			const supabase = createSupabaseServerClient(cookies);
			const { error } = await supabase.auth.signInWithPassword({ email, password });

			if (error) return fail(401, { error: error.message, email });
		} catch {
			return fail(500, {
				error:
					'Supabase is not configured. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY in .env',
				email
			});
		}

		redirect(303, '/admin');
	}
};
