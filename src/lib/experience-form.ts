export interface ExperienceFormFields {
	period: string;
	role: string;
	company: string;
	description: string;
	order_num: string;
}

export function readExperienceForm(formData: FormData): ExperienceFormFields {
	return {
		period: String(formData.get('period') ?? '').trim(),
		role: String(formData.get('role') ?? '').trim(),
		company: String(formData.get('company') ?? '').trim(),
		description: String(formData.get('description') ?? '').trim(),
		order_num: String(formData.get('order_num') ?? '0').trim()
	};
}

export function validateExperienceForm(fields: ExperienceFormFields): string | null {
	if (!fields.role) return 'Role is required.';
	if (!fields.company) return 'Company / Organization is required.';
	if (!fields.period) return 'Period (e.g. 2023 — PRESENT) is required.';
	if (!fields.description) return 'Description is required.';
	return null;
}

export function toExperienceRow(fields: ExperienceFormFields) {
	return {
		period: fields.period,
		role: fields.role,
		company: fields.company,
		description: fields.description,
		order_num: Number.parseInt(fields.order_num, 10) || 0
	};
}
