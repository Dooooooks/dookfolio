import type { Project, Experience } from '$lib/types';
import projectsData from './projects.json';
import experiencesData from './experiences.json';

export function getProjects(): Project[] {
	return projectsData as Project[];
}

export function getExperiences(): Experience[] {
	return (experiencesData as Experience[])
		.slice()
		.sort((a, b) => (a.order_num ?? 0) - (b.order_num ?? 0));
}
