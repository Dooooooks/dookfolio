import { marked } from 'marked';

// Configure marked with GFM and line breaks
marked.setOptions({
	gfm: true,
	breaks: true
});

export interface BlogMeta {
	slug: string;
	title: string;
	date: string;
	formattedDate: string;
	description: string;
	cover?: string;
	tags: string[];
	author: string;
	readTime: string;
}

export interface BlogPost extends BlogMeta {
	content: string;
	html: string;
}

/**
 * Parse frontmatter and content from raw markdown.
 */
function parseFrontmatter(raw: string): { data: Record<string, any>; content: string } {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	if (!match) {
		return { data: {}, content: raw.trim() };
	}

	const yamlBlock = match[1];
	const content = match[2].trim();
	const data: Record<string, any> = {};

	for (const line of yamlBlock.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;

		const colonIdx = trimmed.indexOf(':');
		if (colonIdx === -1) continue;

		const key = trimmed.slice(0, colonIdx).trim();
		let val = trimmed.slice(colonIdx + 1).trim();

		// Strip quotes
		if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
			val = val.slice(1, -1);
		}

		// Parse inline arrays: [tag1, tag2]
		if (val.startsWith('[') && val.endsWith(']')) {
			const items = val
				.slice(1, -1)
				.split(',')
				.map((s) => s.trim().replace(/^["']|["']$/g, ''))
				.filter(Boolean);
			data[key] = items;
		} else {
			data[key] = val;
		}
	}

	return { data, content };
}

function formatDate(dateStr: string): string {
	try {
		const [year, month, day] = dateStr.split('-').map(Number);
		if (year && month && day) {
			const d = new Date(Date.UTC(year, month - 1, day));
			return d.toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				timeZone: 'UTC'
			});
		}
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	} catch {
		return dateStr;
	}
}

function calculateReadTime(text: string): string {
	const words = text.trim().split(/\s+/).filter(Boolean).length;
	const minutes = Math.max(1, Math.ceil(words / 200));
	return `${minutes} min read`;
}

// Vite glob import of all markdown files inside src/content/blogs/
const rawBlogFiles = import.meta.glob('/src/content/blogs/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

/**
 * Returns all blogs sorted by date descending (latest on top).
 */
export function getBlogs(): BlogMeta[] {
	const blogs: BlogMeta[] = [];

	for (const [path, rawContent] of Object.entries(rawBlogFiles)) {
		const slug = path.split('/').pop()?.replace(/\.md$/, '') || '';
		if (!slug) continue;

		const { data, content } = parseFrontmatter(rawContent);

		const title = data.title || slug.replace(/-/g, ' ');
		const date = data.date || '2026-01-01';
		const formattedDate = formatDate(date);
		const description = data.description || data.summary || content.slice(0, 150).replace(/[#*`_]/g, '') + '...';
		const cover = data.cover || data.image || undefined;
		const tags = Array.isArray(data.tags) ? data.tags : data.tag ? [data.tag] : [];
		const author = data.author || 'Lloyd Nicolas';
		const readTime = data.readTime || calculateReadTime(content);

		blogs.push({
			slug,
			title,
			date,
			formattedDate,
			description,
			cover,
			tags,
			author,
			readTime
		});
	}

	// Sort latest first (descending)
	return blogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Returns the top N latest blogs (e.g. 5 for home page).
 */
export function getLatestBlogs(limit = 5): BlogMeta[] {
	return getBlogs().slice(0, limit);
}

/**
 * Retrieves a single blog post by its slug, including rendered HTML.
 */
export function getBlogBySlug(slug: string): BlogPost | null {
	const targetPath = `/src/content/blogs/${slug}.md`;
	const rawContent = rawBlogFiles[targetPath];

	if (!rawContent) {
		return null;
	}

	const { data, content } = parseFrontmatter(rawContent);

	const title = data.title || slug.replace(/-/g, ' ');
	const date = data.date || '2026-01-01';
	const formattedDate = formatDate(date);
	const description = data.description || data.summary || content.slice(0, 150).replace(/[#*`_]/g, '') + '...';
	const cover = data.cover || data.image || undefined;
	const tags = Array.isArray(data.tags) ? data.tags : data.tag ? [data.tag] : [];
	const author = data.author || 'Lloyd Nicolas';
	const readTime = data.readTime || calculateReadTime(content);
	const html = marked.parse(content) as string;

	return {
		slug,
		title,
		date,
		formattedDate,
		description,
		cover,
		tags,
		author,
		readTime,
		content,
		html
	};
}
