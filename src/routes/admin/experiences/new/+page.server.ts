import {
	readExperienceForm,
	toExperienceRow,
	validateExperienceForm
} from '$lib/experience-form';
import { createSupabaseServerClient } from '$lib/supabase/server';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const formData = await request.formData();
		const fields = readExperienceForm(formData);
		const error = validateExperienceForm(fields);

		if (error) return fail(400, { error, fields });

		try {
			const supabase = createSupabaseServerClient(cookies);
			const { error: dbError } = await supabase
				.from('experiences')
				.insert(toExperienceRow(fields));

			if (dbError) return fail(500, { error: dbError.message, fields });
		} catch {
			return fail(500, { error: 'Supabase is not configured.', fields });
		}

		redirect(303, '/admin?tab=experiences');
	}
};
