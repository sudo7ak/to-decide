export type Category = 'decision-making' | 'know-self' | 'know-others' | 'improve-others';

export type OutputSchemaType =
	| 'quadrant2x2'
	| 'radar'
	| 'matrix_table'
	| 'ranked_list'
	| 'flow_diagram'
	| 'freeform_narrative';

export interface ModelExample {
	scenario: string;
	result: Record<string, unknown>;
}

export interface ModelDef {
	id: string;
	slug: string;
	name: string;
	category: Category;
	description: string;
	whenToUse: string;
	origin: string;
	howToApply: string[];
	pros: string[];
	cons: string[];
	example: ModelExample;
	promptTemplate: string;
	outputSchemaType: OutputSchemaType;
	outputJsonSchema: Record<string, unknown>;
	chartComponent: string;
	createdAt: string;
	updatedAt: string;
}

export interface Quadrant2x2Data {
	xAxisLabel: string;
	yAxisLabel: string;
	quadrants: { name: string; x: 'low' | 'high'; y: 'low' | 'high'; items: string[] }[];
	summary: string;
}

export interface MatrixTableData {
	rows: { label: string; items: string[] }[];
	summary: string;
}

export interface RankedListData {
	items: { rank: number; label: string; weight: number; rationale: string }[];
	summary: string;
}

export interface FlowDiagramData {
	steps: { order: number; title: string; description: string }[];
	summary: string;
}

export interface FreeformNarrativeData {
	sections: { heading: string; body: string }[];
	summary: string;
}

export interface RadarData {
	factors: { label: string; score: number }[];
	summary: string;
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
