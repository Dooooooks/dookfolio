import { getBlogs } from '$lib/blogs';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const blogs = getBlogs();
	return {
		blogs
	};
};
