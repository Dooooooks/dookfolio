export interface Project {
	id: string;
	title: string;
	description: string;
	tags: string[];
	demo_url: string | null;
	github_url: string | null;
	cover_url: string | null;
	created_at: string;
}
