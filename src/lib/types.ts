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

export interface Experience {
	id: string;
	period: string;
	role: string;
	company: string;
	description: string;
	order_num?: number;
	created_at?: string;
}

