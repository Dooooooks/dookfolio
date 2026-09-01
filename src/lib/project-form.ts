export interface ProjectFormFields {
	title: string;
	description: string;
	tags: string;
	demo_url: string;
	github_url: string;
	cover_url: string;
}

export function readProjectForm(formData: FormData): ProjectFormFields {
	return {
		title: String(formData.get('title') ?? '').trim(),
		description: String(formData.get('description') ?? '').trim(),
		tags: String(formData.get('tags') ?? '').trim(),
		demo_url: String(formData.get('demo_url') ?? '').trim(),
		github_url: String(formData.get('github_url') ?? '').trim(),
		cover_url: String(formData.get('cover_url') ?? '').trim()
	};
}

export function validateProjectForm(fields: ProjectFormFields): string | null {
	if (!fields.title) return 'Title is required.';
	if (!fields.description) return 'Description is required.';

	if (fields.demo_url && !/^https?:\/\//.test(fields.demo_url)) {
		return 'Demo URL must start with http:// or https://';
	}
	if (fields.github_url && !/^https?:\/\//.test(fields.github_url)) {
		return 'GitHub URL must start with http:// or https://';
	}
	if (fields.cover_url && !/^(https?:\/\/|\/)/.test(fields.cover_url)) {
		return 'Cover Image URL must start with http://, https://, or / (e.g. /ProjectPictures/image.png)';
	}

	return null;
}

export function toProjectRow(fields: ProjectFormFields) {
	return {
		title: fields.title,
		description: fields.description,
		tags: fields.tags
			? fields.tags
					.split(',')
					.map((tag) => tag.trim())
					.filter(Boolean)
			: [],
		demo_url: fields.demo_url || null,
		github_url: fields.github_url || null,
		cover_url: fields.cover_url || null
	};
}
