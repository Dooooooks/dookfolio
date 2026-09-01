import { readProjectForm, toProjectRow, validateProjectForm } from '$lib/project-form';
import { createSupabaseServerClient } from '$lib/supabase/server';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Project } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, params }) => {
	try {
		const supabase = createSupabaseServerClient(cookies);
		const { data } = await supabase.from('projects').select('*').eq('id', params.id).single();

		if (!data) error(404, 'Project not found');
		return { project: data as Project };
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) throw err;
		error(500, 'Supabase is not configured.');
	}
};

export const actions: Actions = {
	default: async ({ request, cookies, params }) => {
		const formData = await request.formData();
		const fields = readProjectForm(formData);
		const validationError = validateProjectForm(fields);

		if (validationError) return fail(400, { error: validationError, fields });

		try {
			const supabase = createSupabaseServerClient(cookies);
			const { error: dbError } = await supabase
				.from('projects')
				.update(toProjectRow(fields))
				.eq('id', params.id);

			if (dbError) return fail(500, { error: dbError.message, fields });
		} catch {
			return fail(500, { error: 'Supabase is not configured.', fields });
		}

		redirect(303, '/admin');
	}
};
