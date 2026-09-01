import { readProjectForm, toProjectRow, validateProjectForm } from '$lib/project-form';
import { createSupabaseServerClient } from '$lib/supabase/server';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const fields = readProjectForm(formData);
		const error = validateProjectForm(fields);

		if (error) return fail(400, { error, fields });

		try {
			const supabase = createSupabaseServerClient(cookies);
			const { error: dbError } = await supabase.from('projects').insert(toProjectRow(fields));

			if (dbError) return fail(500, { error: dbError.message, fields });
		} catch {
			return fail(500, { error: 'Supabase is not configured.', fields });
		}

		redirect(303, '/admin');
	}
};
