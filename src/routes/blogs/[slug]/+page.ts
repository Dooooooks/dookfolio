import { error } from '@sveltejs/kit';
import { getBlogBySlug, getBlogs } from '$lib/blogs';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => {
	return getBlogs().map((blog) => ({ slug: blog.slug }));
};

export const load: PageLoad = ({ params }) => {
	const blog = getBlogBySlug(params.slug);

	if (!blog) {
		throw error(404, `Blog post "${params.slug}" not found.`);
	}

	return {
		blog
	};
};
