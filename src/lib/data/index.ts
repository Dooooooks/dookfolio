import type { Project, Experience } from '$lib/types';
import projectsData from './projects.json';
import experiencesData from './experiences.json';

export function getProjects(): Project[] {
	return (projectsData as Project[]).slice().sort((a, b) => {
		const dateA = a.date || '';
		const dateB = b.date || '';
		return dateB.localeCompare(dateA);
	});
}

export function getExperiences(): Experience[] {
	return (experiencesData as Experience[]).slice().sort((a, b) => {
		const dateA = a.date || '';
		const dateB = b.date || '';
		return dateB.localeCompare(dateA);
	});
}
