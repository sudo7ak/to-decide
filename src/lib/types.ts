export type Category = 'decision-making' | 'know-self' | 'know-others' | 'improve-others';

export type OutputSchemaType =
	| 'quadrant2x2'
	| 'radar'
	| 'matrix_table'
	| 'ranked_list'
	| 'flow_diagram'
	| 'freeform_narrative';

export interface ModelDef {
	id: string;
	slug: string;
	name: string;
	category: Category;
	description: string;
	whenToUse: string;
	promptTemplate: string;
	outputSchemaType: OutputSchemaType;
	outputJsonSchema: Record<string, unknown>;
	chartComponent: string;
	createdAt: string;
	updatedAt: string;
}

export interface Question {
	id: string;
	text: string;
	createdAt: string;
}

export interface Analysis {
	id: string;
	questionId: string;
	modelId: string;
	resultJson: Record<string, unknown>;
	createdAt: string;
	updatedAt: string;
	syncedAt: string | null;
}
