// Technical skills categorized by domain with proof-of-work project references

export interface SkillItem {
	name: string;
	project?: string;
}

export interface SkillCategory {
	id: 'frontend' | 'backend' | 'game' | 'systems' | 'design' | 'ai' | 'tools';
	title: string;
	skills: SkillItem[];
}

export const SKILL_CATEGORIES: SkillCategory[] = [
	{
		id: 'frontend',
		title: 'Web & Frontend',
		skills: [
			{ name: 'TypeScript' },
			{ name: 'SvelteKit 5', project: 'Dookfolio' },
			{ name: 'React.js', project: 'Go Budget' },
			{ name: 'Tailwind CSS' },
			{ name: 'Vite', project: 'Go Budget' },
			{ name: 'HTML5 / CSS3' }
		]
	},
	{
		id: 'backend',
		title: 'Backend & Cloud',
		skills: [
			{ name: 'Node.js' },
			{ name: 'Supabase', project: 'Go Budget / Barangay Together' },
			{ name: 'PostgreSQL' },
			{ name: 'PHP', project: 'Barangay Together' },
			{ name: 'REST APIs' },
			{ name: 'Google Cloud VPS', project: 'Palworld Server' }
		]
	},
	{
		id: 'ai',
		title: 'AI & Agents',
		skills: [
			{ name: 'OpenCode' },
			{ name: 'Hermes' },
			{ name: 'Claude Code' },
			{ name: 'Antigravity' },
			{ name: 'Ollama' }
		]
	},
	{
		id: 'systems',
		title: 'Systems & Research',
		skills: [
			{ name: 'Linux (Arch / Ubuntu)', project: 'Omaclippr / VPS' },
			{ name: 'Bash / Shell Scripting', project: 'Omaclippr / Palworld Server' },
			{ name: 'YOLOv12 / Computer Vision', project: 'Driver Distraction Thesis' },
			{ name: 'Git / GitHub Workflow' }
		]
	},
	{
		id: 'game',
		title: 'Game Dev & Audio',
		skills: [
			{ name: 'Godot Engine', project: 'Been Here Before / Flappy Bird' },
			{ name: '2D Physics & Mechanics', project: 'Flappy Bird Clone' },
			{ name: 'Game Jams (Itch.io)', project: 'Been Here Before' },
			{ name: 'Web Audio API Synth', project: 'Dookfolio 8-Bit Engine' }
		]
	},
	{
		id: 'design',
		title: 'UI/UX & Prototyping',
		skills: [
			{ name: 'Figma Prototyping', project: 'Binladin Contracting Group' },
			{ name: 'User Flows & Wireframing' },
			{ name: 'Responsive Web Design' }
		]
	},
	{
		id: 'tools',
		title: 'Tools & Collaboration',
		skills: [
			{ name: 'Docker' },
			{ name: 'GitHub Actions' },
			{ name: 'Stripe' },
			{ name: 'PowerBI' },
			{ name: 'ClickUp' },
			{ name: 'Discord' },
			{ name: 'Teams' }
		]
	}
];
