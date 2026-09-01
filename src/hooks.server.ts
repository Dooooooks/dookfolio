import { createSupabaseServerClient } from '$lib/supabase/server';
import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	if (pathname === '/admin' || pathname.startsWith('/admin/')) {
		const isLogin = pathname === '/admin/login';
		let user = null;

		try {
			const supabase = createSupabaseServerClient(event.cookies);
			const { data } = await supabase.auth.getUser();
			user = data.user;
		} catch {
			// ignore auth error
		}

		if (!user && !isLogin) redirect(303, '/admin/login');
		if (user && isLogin) redirect(303, '/admin');
	}

	return resolve(event);
};
