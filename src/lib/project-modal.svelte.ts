import type { Project } from '$lib/types';

export const projectModal = $state<{
	open: boolean;
	project: Project | null;
}>({
	open: false,
	project: null
});

export function openProjectModal(project: Project) {
	projectModal.project = project;
	projectModal.open = true;
}

export function closeProjectModal() {
	projectModal.open = false;
	projectModal.project = null;
}
