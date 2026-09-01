import { createSupabaseServerClient } from '$lib/supabase/server';
import { fail, redirect } from '@sveltejs/kit';
import type { Experience, Project } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	try {
		const supabase = createSupabaseServerClient(cookies);
		const [{ data: projects, error: projectsError }, { data: experiences, error: experiencesError }] =
			await Promise.all([
				supabase.from('projects').select('*').order('created_at', { ascending: false }),
				supabase
					.from('experiences')
					.select('*')
					.order('order_num', { ascending: true })
					.order('created_at', { ascending: false })
			]);

		const error = projectsError?.message || experiencesError?.message || null;

		return {
			projects: (projects ?? []) as Project[],
			experiences: (experiences ?? []) as Experience[],
			error
		};
	} catch {
		return {
			projects: [] as Project[],
			experiences: [] as Experience[],
			error: 'Supabase is not configured. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY in .env'
		};
	}
};

export const actions: Actions = {
	delete: async ({ request, cookies }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');

		try {
			const supabase = createSupabaseServerClient(cookies);
			const { error } = await supabase.from('projects').delete().eq('id', id);

			if (error) return fail(500, { error: error.message });
		} catch {
			return fail(500, { error: 'Supabase is not configured.' });
		}
	},
	deleteExperience: async ({ request, cookies }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');

		try {
			const supabase = createSupabaseServerClient(cookies);
			const { error } = await supabase.from('experiences').delete().eq('id', id);

			if (error) return fail(500, { error: error.message });
		} catch {
			return fail(500, { error: 'Supabase is not configured.' });
		}
	},
	logout: async ({ cookies }) => {
		try {
			const supabase = createSupabaseServerClient(cookies);
			await supabase.auth.signOut();
		} catch {
			cookies.delete('sb-access-token', { path: '/' });
			cookies.delete('sb-refresh-token', { path: '/' });
		}

		redirect(303, '/admin/login');
	}
};
