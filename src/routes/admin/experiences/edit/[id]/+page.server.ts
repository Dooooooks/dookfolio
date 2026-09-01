import {
	readExperienceForm,
	toExperienceRow,
	validateExperienceForm
} from '$lib/experience-form';
import { createSupabaseServerClient } from '$lib/supabase/server';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Experience } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, params }) => {
	try {
		const supabase = createSupabaseServerClient(cookies);
		const { data } = await supabase.from('experiences').select('*').eq('id', params.id).single();

		if (!data) error(404, 'Experience not found');
		return { experience: data as Experience };
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) throw err;
		error(500, 'Supabase is not configured.');
	}
};

export const actions: Actions = {
	default: async ({ request, cookies, params }) => {
		const formData = await request.formData();
		const fields = readExperienceForm(formData);
		const validationError = validateExperienceForm(fields);

		if (validationError) return fail(400, { error: validationError, fields });

		try {
			const supabase = createSupabaseServerClient(cookies);
			const { error: dbError } = await supabase
				.from('experiences')
				.update(toExperienceRow(fields))
				.eq('id', params.id);

			if (dbError) return fail(500, { error: dbError.message, fields });
		} catch {
			return fail(500, { error: 'Supabase is not configured.', fields });
		}

		redirect(303, '/admin?tab=experiences');
	}
};
