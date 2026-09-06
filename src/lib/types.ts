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
	quadrants: {
		name: string;
		x: 'low' | 'high';
		y: 'low' | 'high';
		items: string[];
		/**
		 * A short, stable one-line playbook for this quadrant itself (e.g. BCG's
		 * "Milk for cash, fund it minimally" for Cash Cow) — what the quadrant
		 * means or implies, independent of whichever specific items happen to be
		 * sorted into it. Optional so existing/partial data keeps rendering; when
		 * present it also gives an empty quadrant (0 items) real context instead
		 * of a bare "No items".
		 */
		guidance?: string;
	}[];
	summary: string;
}

export interface MatrixTableRow {
	label: string;
	items: string[];
	/**
	 * Optional polarity for models where a row is inherently good/bad for the
	 * decision (SWOT's Strengths vs Weaknesses, Yes/No's Hell Yes vs No, the
	 * recommended style in Conflict Resolution). Rows with no inherent polarity
	 * (Morphological Box parameters, Sinus-Milieu segments) omit this and
	 * render as neutral — never invented just to fill the field.
	 */
	tone?: 'positive' | 'negative';
}

export interface MatrixPayoffCell {
	/** This row's choice (must match one of payoffGrid.rowChoices). */
	rowChoice: string;
	/** This column's choice (must match one of payoffGrid.colChoices). */
	colChoice: string;
	/** What happens in this combination of choices. */
	outcome: string;
}

export interface MatrixPayoffGrid {
	rowPlayerLabel: string;
	colPlayerLabel: string;
	rowChoices: [string, string];
	colChoices: [string, string];
	/** Exactly one cell for each of the 4 (rowChoice, colChoice) combinations. */
	cells: MatrixPayoffCell[];
}

export interface MatrixTableData {
	/**
	 * Categorized rows rendered as a real table (one row per category, its
	 * items as cell content). Used by every matrix_table model except
	 * 2-player payoff games, which use `payoffGrid` instead.
	 */
	rows?: MatrixTableRow[];
	/**
	 * A 2-player x 2-choice payoff matrix (e.g. Prisoner's Dilemma), rendered
	 * as a real crosstab table. Mutually exclusive with `rows` in practice.
	 */
	payoffGrid?: MatrixPayoffGrid;
	summary: string;
}

export interface RankedListData {
	items: { rank: number; label: string; weight: number; rationale: string }[];
	summary: string;
}

export interface FlowDiagramStep {
	order: number;
	title: string;
	description: string;
	/**
	 * How this step behaves in the flow. Omit for a plain sequential step
	 * (the vast majority — GROW, the Feedback Box, the Consequence Model,
	 * the Buyer's Decision Model, Tuckman's stages, Drexler-Sibbet, etc.).
	 * - 'gate': a checkpoint the flow passes *through* rather than an action
	 *   taken — used only by the Swiss Cheese Model, where each step is a
	 *   layer of defense with a hole in it, not a stage someone performs.
	 * - 'gap': this step is separated from the previous one by a real
	 *   discontinuity, not an ordinary next step — used only by Crossing the
	 *   Chasm's "The Chasm" step (the gap between early adopters and the
	 *   early majority on the adoption curve).
	 */
	kind?: 'stage' | 'gate' | 'gap';
	/**
	 * The `order` of an earlier step this step's flow loops back to, for
	 * models that are genuinely cyclical rather than one-way: Double Loop
	 * Learning (both its single-loop fix and its double-loop change return
	 * to the immediate problem), Appreciative Inquiry (Destiny renews into
	 * Discover — the 4-D cycle), and the Making-of Model (the lesson feeds
	 * the next Intention). Omit for models that actually end.
	 */
	loopsTo?: number;
}

export interface FlowDiagramData {
	steps: FlowDiagramStep[];
	summary: string;
}

// The rhetorical role a narrative section plays: `situation` (the baseline or
// observed facts), `tension` (a named conflict, risk, or gap), `insight` (the
// underlying mechanism or realization), or `implication` (what it means or
// requires going forward). Drives the chart's color/icon coding instead of a
// meaningless decorative sequence.
export type NarrativeSectionKind = 'situation' | 'tension' | 'insight' | 'implication';

export interface FreeformNarrativeData {
	sections: {
		heading: string;
		body: string;
		// Optional so narrative results saved before this field existed (or
		// produced by a prompt that omits it) keep rendering — the chart falls
		// back to a neutral, uncoded layout instead of breaking.
		kind?: NarrativeSectionKind;
	}[];
	summary: string;
}

export interface RadarData {
	// `targetScore` is optional per factor: a reference/benchmark point ("where
	// you want to be") plotted as a second shape against `score` ("where you
	// are now"). Renders only when every factor supplies one — a partial target
	// wouldn't correspond to any real state.
	factors: { label: string; score: number; targetScore?: number }[];
	// Ceiling for `score`/`targetScore`. Optional so existing data keeps working;
	// defaults to 10 (the 0–10 self-rating convention every current radar model
	// uses) when omitted, instead of the chart silently assuming a scale.
	maxScore?: number;
	summary: string;
}

export interface Question {
	id: string;
	text: string;
	createdAt: string;
	/** Model slugs the LLM recommended for this question, computed once on first view. */
	recommendedModelIds?: string[];
}

export interface Analysis {
	id: string;
	questionId: string;
	modelId: string;
	resultJson: Record<string, unknown>;
	createdAt: string;
	updatedAt: string;
	syncedAt: string | null;
	/** User's self-rated confidence in this analysis result (1 = not useful, 5 = very useful). */
	userRating?: 1 | 2 | 3 | 4 | 5;
}
