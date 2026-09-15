import type { Project, Experience } from '$lib/types';
import projectsData from './projects.json';
import experiencesData from './experiences.json';

export function getProjects(): Project[] {
	return (projectsData as Project[]).slice().sort((a, b) => {
		const dateA = a.date || a.created_at || '';
		const dateB = b.date || b.created_at || '';
		return dateB.localeCompare(dateA);
	});
}

export function getExperiences(): Experience[] {
	return (experiencesData as Experience[]).slice().sort((a, b) => {
		const dateA = a.date || a.created_at || '';
		const dateB = b.date || b.created_at || '';
		if (dateA && dateB) {
			return dateB.localeCompare(dateA);
		}
		return (a.order_num ?? 0) - (b.order_num ?? 0);
	});
}
