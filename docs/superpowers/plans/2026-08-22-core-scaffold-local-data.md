# Core Scaffold & Local-First Data Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the SvelteKit app skeleton with a working local-first data layer (Dexie/IndexedDB) — question capture, and a DB-driven model registry browsable end to end — with no LLM calls and no cloud sync yet.

**Architecture:** SvelteKit app, fully client-rendered (SSR off — all data lives in IndexedDB, a browser-only API), Tailwind CSS v4 for styling, Dexie as the typed wrapper around IndexedDB. Three Dexie tables — `models`, `questions`, `analyses` — mirror the Supabase schema the later cloud-sync plan will introduce, so no data-layer rework is needed then. The 8 v1 seed models ship as a bundled JSON fixture and get inserted into `models` on first load, standing in for "pull from Supabase" until that plan exists. This is plan 1 of 3 (core scaffold → analysis engine → auth/sync); it must produce complete, working, testable software on its own: create a question, browse the model library, read any model's explainer page.

**Tech Stack:** SvelteKit, TypeScript, Svelte 5 (runes), Tailwind CSS v4, Dexie.js, Vitest, @testing-library/svelte, fake-indexeddb, adapter-cloudflare (set now so later plans don't need to touch build config).

**Spec:** `docs/superpowers/specs/2026-08-22-decision-copilot-design.md`

## Global Constraints

- Local-first: the app must be fully usable (create questions, browse models) with zero network access. Nothing in this plan may require a server round-trip.
- No SSR: `models`/`questions`/`analyses` live in IndexedDB via Dexie, which does not exist server-side. SSR is disabled app-wide.
- D3.js is the only charting library used anywhere in this project (not exercised yet in this plan, but no other charting dependency may be introduced).
- `output_schema_type` values are fixed to exactly these six: `quadrant2x2`, `radar`, `matrix_table`, `ranked_list`, `flow_diagram`, `freeform_narrative`. Every model's `outputSchemaType` must be one of these.
- Deployment target is Cloudflare Pages + Pages Functions — `adapter-cloudflare` is the adapter, decided now to avoid rework.

---

### Task 1: Scaffold the SvelteKit project

**Files:**
- Create: whole project skeleton (`package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `src/app.html`, `src/app.d.ts`, `.gitignore`)

**Interfaces:**
- Consumes: nothing (first task)
- Produces: a working `npm run dev`, `npm run build`, `npm run check`, and `npm run test` in this directory, for every later task to build on

- [ ] **Step 1: Scaffold via the Svelte CLI**

```bash
npx sv create . --template minimal --types ts --no-install
```

If it prompts interactively instead of honoring the flags, choose: **Skeleton project**, **TypeScript syntax**, no add-ons (we wire Tailwind/Vitest by hand in the next steps for exact control over versions).

- [ ] **Step 2: Install base dependencies**

```bash
npm install
npm install -D @sveltejs/adapter-cloudflare
```

- [ ] **Step 3: Configure the Cloudflare adapter**

Edit `svelte.config.js`:

```js
import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter()
	}
};

export default config;
```

- [ ] **Step 4: Add Tailwind CSS v4**

```bash
npm install -D tailwindcss @tailwindcss/vite
```

Edit `vite.config.ts` to add the plugin:

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		environment: 'jsdom',
		globals: true
	}
});
```

Create `src/app.css`:

```css
@import 'tailwindcss';
```

Edit `src/app.html` — no change needed yet; `app.css` gets imported from the root layout in Task 9.

- [ ] **Step 5: Add Vitest and testing libraries**

```bash
npm install -D vitest jsdom @testing-library/svelte @testing-library/jest-dom fake-indexeddb
```

Add a test script to `package.json`:

```json
"scripts": {
  "test": "vitest run"
}
```

- [ ] **Step 6: Verify the pipeline with a throwaway smoke test**

Create `src/lib/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('scaffold smoke test', () => {
	it('runs', () => {
		expect(1 + 1).toBe(2);
	});
});
```

Run: `npm run test`
Expected: 1 passed test.

Delete `src/lib/smoke.test.ts` once confirmed — it was only proving the pipeline works.

- [ ] **Step 7: Verify dev server and typecheck**

Run: `npm run dev` — confirm it starts without error, then stop it (Ctrl+C).
Run: `npm run check` — confirm no TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold SvelteKit app with Tailwind v4, Vitest, Cloudflare adapter"
```

---

### Task 2: Shared types and the Dexie schema

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/db.ts`
- Create: `src/lib/db.test.ts`
- Create: `src/routes/+layout.ts`

**Interfaces:**
- Consumes: nothing new
- Produces:
  - `src/lib/types.ts` exports: `type Category = 'decision-making' | 'know-self' | 'know-others' | 'improve-others'`, `type OutputSchemaType = 'quadrant2x2' | 'radar' | 'matrix_table' | 'ranked_list' | 'flow_diagram' | 'freeform_narrative'`, `interface ModelDef`, `interface Question`, `interface Analysis`
  - `src/lib/db.ts` exports: `class DecisionCopilotDB extends Dexie` and a singleton `db: DecisionCopilotDB` with tables `db.models: Table<ModelDef, string>`, `db.questions: Table<Question, string>`, `db.analyses: Table<Analysis, string>`

- [ ] **Step 1: Write the shared types**

Create `src/lib/types.ts`:

```ts
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
```

- [ ] **Step 2: Install Dexie**

```bash
npm install dexie
```

- [ ] **Step 3: Write the failing test for the DB schema**

Create `src/lib/db.test.ts`:

```ts
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './db';

describe('DecisionCopilotDB', () => {
	beforeEach(async () => {
		await db.models.clear();
		await db.questions.clear();
		await db.analyses.clear();
	});

	it('stores and retrieves a question', async () => {
		await db.questions.add({
			id: 'q1',
			text: 'Should I take the job?',
			createdAt: '2026-08-22T00:00:00.000Z'
		});
		const found = await db.questions.get('q1');
		expect(found?.text).toBe('Should I take the job?');
	});

	it('stores and retrieves a model by slug via index', async () => {
		await db.models.add({
			id: 'm1',
			slug: 'eisenhower-matrix',
			name: 'Eisenhower Matrix',
			category: 'decision-making',
			description: 'd',
			whenToUse: 'w',
			promptTemplate: 'p',
			outputSchemaType: 'quadrant2x2',
			outputJsonSchema: {},
			chartComponent: 'Quadrant2x2Chart',
			createdAt: '2026-08-22T00:00:00.000Z',
			updatedAt: '2026-08-22T00:00:00.000Z'
		});
		const found = await db.models.where('slug').equals('eisenhower-matrix').first();
		expect(found?.name).toBe('Eisenhower Matrix');
	});
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm run test -- db.test.ts`
Expected: FAIL — `db.ts` does not exist yet.

- [ ] **Step 5: Implement the Dexie schema**

Create `src/lib/db.ts`:

```ts
import Dexie, { type Table } from 'dexie';
import type { ModelDef, Question, Analysis } from './types';

export class DecisionCopilotDB extends Dexie {
	models!: Table<ModelDef, string>;
	questions!: Table<Question, string>;
	analyses!: Table<Analysis, string>;

	constructor() {
		super('decision-copilot');
		this.version(1).stores({
			models: 'id, slug, category',
			questions: 'id, createdAt',
			analyses: 'id, questionId, modelId'
		});
	}
}

export const db = new DecisionCopilotDB();
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- db.test.ts`
Expected: 2 passed.

- [ ] **Step 7: Disable SSR app-wide**

Dexie/IndexedDB is browser-only; every route in this app depends on it. Create `src/routes/+layout.ts`:

```ts
export const ssr = false;
export const prerender = false;
```

- [ ] **Step 8: Commit**

```bash
git add src/lib/types.ts src/lib/db.ts src/lib/db.test.ts src/routes/+layout.ts
git commit -m "feat: add shared types and Dexie schema, disable SSR"
```

---

### Task 3: Seed data for the 8 v1 models

**Files:**
- Create: `src/lib/db/seed-models.json`
- Create: `src/lib/db/seed.ts`
- Create: `src/lib/db/seed.test.ts`

**Interfaces:**
- Consumes: `db` and `ModelDef` from Task 2 (`src/lib/db.ts`, `src/lib/types.ts`)
- Produces: `src/lib/db/seed.ts` exports `async function seedModelsIfEmpty(): Promise<void>`

- [ ] **Step 1: Write the seed data**

Create `src/lib/db/seed-models.json`:

```json
[
	{
		"id": "eisenhower-matrix",
		"slug": "eisenhower-matrix",
		"name": "Eisenhower Matrix",
		"category": "decision-making",
		"description": "Sorts the tasks or choices bound up in your question into four boxes by urgency and importance, so you can see what actually deserves your attention first.",
		"whenToUse": "Use when you're overwhelmed by competing tasks or options and need to decide what to act on now versus later.",
		"promptTemplate": "You are helping someone apply the Eisenhower Matrix to a decision. Given their question: \"{{question}}\", identify the concrete tasks or considerations implied by it and classify each into one of four quadrants by urgency (x: low or high) and importance (y: low or high). Respond with ONLY JSON matching this shape, no prose outside the JSON: {\"xAxisLabel\": \"Urgency\", \"yAxisLabel\": \"Importance\", \"quadrants\": [{\"name\": \"Do First\", \"x\": \"high\", \"y\": \"high\", \"items\": [\"...\"]}, {\"name\": \"Schedule\", \"x\": \"low\", \"y\": \"high\", \"items\": [\"...\"]}, {\"name\": \"Delegate\", \"x\": \"high\", \"y\": \"low\", \"items\": [\"...\"]}, {\"name\": \"Eliminate\", \"x\": \"low\", \"y\": \"low\", \"items\": [\"...\"]}], \"summary\": \"...\"}",
		"outputSchemaType": "quadrant2x2",
		"outputJsonSchema": {
			"type": "object",
			"required": ["xAxisLabel", "yAxisLabel", "quadrants", "summary"],
			"properties": {
				"xAxisLabel": { "type": "string" },
				"yAxisLabel": { "type": "string" },
				"quadrants": {
					"type": "array",
					"minItems": 4,
					"maxItems": 4,
					"items": {
						"type": "object",
						"required": ["name", "x", "y", "items"],
						"properties": {
							"name": { "type": "string" },
							"x": { "type": "string", "enum": ["low", "high"] },
							"y": { "type": "string", "enum": ["low", "high"] },
							"items": { "type": "array", "items": { "type": "string" } }
						}
					}
				},
				"summary": { "type": "string" }
			}
		},
		"chartComponent": "Quadrant2x2Chart",
		"createdAt": "2026-08-22T00:00:00.000Z",
		"updatedAt": "2026-08-22T00:00:00.000Z"
	},
	{
		"id": "swot-analysis",
		"slug": "swot-analysis",
		"name": "SWOT Analysis",
		"category": "decision-making",
		"description": "Breaks your question down into Strengths, Weaknesses, Opportunities and Threats.",
		"whenToUse": "Use when evaluating a plan, venture, or choice against both your own capabilities and the outside environment.",
		"promptTemplate": "You are helping someone apply a SWOT Analysis to a decision. Given their question: \"{{question}}\", produce Strengths, Weaknesses, Opportunities, and Threats relevant to it. Respond with ONLY JSON matching this shape: {\"rows\": [{\"label\": \"Strengths\", \"items\": [\"...\"]}, {\"label\": \"Weaknesses\", \"items\": [\"...\"]}, {\"label\": \"Opportunities\", \"items\": [\"...\"]}, {\"label\": \"Threats\", \"items\": [\"...\"]}], \"summary\": \"...\"}",
		"outputSchemaType": "matrix_table",
		"outputJsonSchema": {
			"type": "object",
			"required": ["rows", "summary"],
			"properties": {
				"rows": {
					"type": "array",
					"items": {
						"type": "object",
						"required": ["label", "items"],
						"properties": {
							"label": { "type": "string" },
							"items": { "type": "array", "items": { "type": "string" } }
						}
					}
				},
				"summary": { "type": "string" }
			}
		},
		"chartComponent": "MatrixTableChart",
		"createdAt": "2026-08-22T00:00:00.000Z",
		"updatedAt": "2026-08-22T00:00:00.000Z"
	},
	{
		"id": "bcg-box",
		"slug": "bcg-box",
		"name": "BCG Box",
		"category": "decision-making",
		"description": "Plots the options or initiatives in your question on market growth versus relative share to see which deserve investment, which to hold, and which to drop.",
		"whenToUse": "Use when comparing multiple options, initiatives, or products for where to put limited resources.",
		"promptTemplate": "You are helping someone apply the BCG Growth-Share Box to a decision. Given their question: \"{{question}}\", identify the options or initiatives implied by it and classify each by relative share (x: low or high) and market growth (y: low or high). Respond with ONLY JSON matching this shape: {\"xAxisLabel\": \"Relative Market Share\", \"yAxisLabel\": \"Market Growth\", \"quadrants\": [{\"name\": \"Star\", \"x\": \"high\", \"y\": \"high\", \"items\": [\"...\"]}, {\"name\": \"Cash Cow\", \"x\": \"high\", \"y\": \"low\", \"items\": [\"...\"]}, {\"name\": \"Question Mark\", \"x\": \"low\", \"y\": \"high\", \"items\": [\"...\"]}, {\"name\": \"Dog\", \"x\": \"low\", \"y\": \"low\", \"items\": [\"...\"]}], \"summary\": \"...\"}",
		"outputSchemaType": "quadrant2x2",
		"outputJsonSchema": {
			"type": "object",
			"required": ["xAxisLabel", "yAxisLabel", "quadrants", "summary"],
			"properties": {
				"xAxisLabel": { "type": "string" },
				"yAxisLabel": { "type": "string" },
				"quadrants": {
					"type": "array",
					"minItems": 4,
					"maxItems": 4,
					"items": {
						"type": "object",
						"required": ["name", "x", "y", "items"],
						"properties": {
							"name": { "type": "string" },
							"x": { "type": "string", "enum": ["low", "high"] },
							"y": { "type": "string", "enum": ["low", "high"] },
							"items": { "type": "array", "items": { "type": "string" } }
						}
					}
				},
				"summary": { "type": "string" }
			}
		},
		"chartComponent": "Quadrant2x2Chart",
		"createdAt": "2026-08-22T00:00:00.000Z",
		"updatedAt": "2026-08-22T00:00:00.000Z"
	},
	{
		"id": "johari-window",
		"slug": "johari-window",
		"name": "Johari Window",
		"category": "know-self",
		"description": "Maps what's known and unknown to you and to others about the situation in your question, to surface blind spots.",
		"whenToUse": "Use when trying to understand yourself better, or close a gap between how you see yourself and how others see you.",
		"promptTemplate": "You are helping someone apply the Johari Window to a question about themselves. Given their question: \"{{question}}\", populate the four panes: Arena (known to self, known to others), Blind Spot (unknown to self, known to others), Facade (known to self, unknown to others), Unknown (unknown to self, unknown to others). Respond with ONLY JSON matching this shape: {\"xAxisLabel\": \"Known to Self\", \"yAxisLabel\": \"Known to Others\", \"quadrants\": [{\"name\": \"Arena\", \"x\": \"high\", \"y\": \"high\", \"items\": [\"...\"]}, {\"name\": \"Blind Spot\", \"x\": \"low\", \"y\": \"high\", \"items\": [\"...\"]}, {\"name\": \"Facade\", \"x\": \"high\", \"y\": \"low\", \"items\": [\"...\"]}, {\"name\": \"Unknown\", \"x\": \"low\", \"y\": \"low\", \"items\": [\"...\"]}], \"summary\": \"...\"}",
		"outputSchemaType": "quadrant2x2",
		"outputJsonSchema": {
			"type": "object",
			"required": ["xAxisLabel", "yAxisLabel", "quadrants", "summary"],
			"properties": {
				"xAxisLabel": { "type": "string" },
				"yAxisLabel": { "type": "string" },
				"quadrants": {
					"type": "array",
					"minItems": 4,
					"maxItems": 4,
					"items": {
						"type": "object",
						"required": ["name", "x", "y", "items"],
						"properties": {
							"name": { "type": "string" },
							"x": { "type": "string", "enum": ["low", "high"] },
							"y": { "type": "string", "enum": ["low", "high"] },
							"items": { "type": "array", "items": { "type": "string" } }
						}
					}
				},
				"summary": { "type": "string" }
			}
		},
		"chartComponent": "Quadrant2x2Chart",
		"createdAt": "2026-08-22T00:00:00.000Z",
		"updatedAt": "2026-08-22T00:00:00.000Z"
	},
	{
		"id": "grow-whitmore",
		"slug": "grow-whitmore",
		"name": "GROW Model (Whitmore)",
		"category": "improve-others",
		"description": "Walks your question through Goal, Reality, Options, Will — John Whitmore's coaching model for moving from stuck to a concrete next action.",
		"whenToUse": "Use when coaching yourself or someone else through a specific goal or performance question.",
		"promptTemplate": "You are helping someone apply the GROW coaching model (Goal, Reality, Options, Will) to a question. Given their question: \"{{question}}\", produce one step for each of the four stages, in order. Respond with ONLY JSON matching this shape: {\"steps\": [{\"order\": 1, \"title\": \"Goal\", \"description\": \"...\"}, {\"order\": 2, \"title\": \"Reality\", \"description\": \"...\"}, {\"order\": 3, \"title\": \"Options\", \"description\": \"...\"}, {\"order\": 4, \"title\": \"Will\", \"description\": \"...\"}], \"summary\": \"...\"}",
		"outputSchemaType": "flow_diagram",
		"outputJsonSchema": {
			"type": "object",
			"required": ["steps", "summary"],
			"properties": {
				"steps": {
					"type": "array",
					"items": {
						"type": "object",
						"required": ["order", "title", "description"],
						"properties": {
							"order": { "type": "number" },
							"title": { "type": "string" },
							"description": { "type": "string" }
						}
					}
				},
				"summary": { "type": "string" }
			}
		},
		"chartComponent": "FlowDiagramChart",
		"createdAt": "2026-08-22T00:00:00.000Z",
		"updatedAt": "2026-08-22T00:00:00.000Z"
	},
	{
		"id": "pareto-principle",
		"slug": "pareto-principle",
		"name": "Pareto Principle",
		"category": "decision-making",
		"description": "Identifies the small subset of factors in your question likely responsible for most of the outcome — the 80/20 view.",
		"whenToUse": "Use when you have many possible causes or actions and need to find the vital few worth focusing on.",
		"promptTemplate": "You are helping someone apply the Pareto Principle (80/20 rule) to a question. Given their question: \"{{question}}\", identify the factors involved, rank them by how much of the outcome each one likely drives, and give each a weight (0-100) reflecting its share of the impact. Respond with ONLY JSON matching this shape: {\"items\": [{\"rank\": 1, \"label\": \"...\", \"weight\": 40, \"rationale\": \"...\"}], \"summary\": \"...\"}",
		"outputSchemaType": "ranked_list",
		"outputJsonSchema": {
			"type": "object",
			"required": ["items", "summary"],
			"properties": {
				"items": {
					"type": "array",
					"items": {
						"type": "object",
						"required": ["rank", "label", "weight", "rationale"],
						"properties": {
							"rank": { "type": "number" },
							"label": { "type": "string" },
							"weight": { "type": "number", "minimum": 0, "maximum": 100 },
							"rationale": { "type": "string" }
						}
					}
				},
				"summary": { "type": "string" }
			}
		},
		"chartComponent": "RankedListChart",
		"createdAt": "2026-08-22T00:00:00.000Z",
		"updatedAt": "2026-08-22T00:00:00.000Z"
	},
	{
		"id": "cognitive-dissonance",
		"slug": "cognitive-dissonance",
		"name": "Cognitive Dissonance",
		"category": "know-self",
		"description": "Looks at the tension between conflicting beliefs, values, or actions embedded in your question, and how that discomfort might be shaping your thinking.",
		"whenToUse": "Use when you notice you're rationalizing a choice, or your stated values and actual behavior seem to conflict.",
		"promptTemplate": "You are helping someone examine cognitive dissonance in a question about their own beliefs or behavior. Given their question: \"{{question}}\", write short narrative sections covering: the conflicting beliefs or actions at play, the rationalizations likely being used to reduce the discomfort, and what genuinely resolving the conflict would require. Respond with ONLY JSON matching this shape: {\"sections\": [{\"heading\": \"The Conflicting Beliefs\", \"body\": \"...\"}, {\"heading\": \"The Rationalization at Work\", \"body\": \"...\"}, {\"heading\": \"What Resolving It Would Require\", \"body\": \"...\"}], \"summary\": \"...\"}",
		"outputSchemaType": "freeform_narrative",
		"outputJsonSchema": {
			"type": "object",
			"required": ["sections", "summary"],
			"properties": {
				"sections": {
					"type": "array",
					"items": {
						"type": "object",
						"required": ["heading", "body"],
						"properties": {
							"heading": { "type": "string" },
							"body": { "type": "string" }
						}
					}
				},
				"summary": { "type": "string" }
			}
		},
		"chartComponent": "NarrativeChart",
		"createdAt": "2026-08-22T00:00:00.000Z",
		"updatedAt": "2026-08-22T00:00:00.000Z"
	},
	{
		"id": "scamper",
		"slug": "scamper",
		"name": "SCAMPER",
		"category": "decision-making",
		"description": "Generates fresh options for your question by forcing it through seven lenses: Substitute, Combine, Adapt, Modify, Put to another use, Eliminate, Reverse.",
		"whenToUse": "Use when you feel stuck on a decision and want to force fresh alternatives into view.",
		"promptTemplate": "You are helping someone apply SCAMPER to generate options for a decision. Given their question: \"{{question}}\", generate exactly one concrete idea for each of the seven SCAMPER lenses (Substitute, Combine, Adapt, Modify, Put to another use, Eliminate, Reverse), ranked 1-7 in that order, with a weight (0-100) for how promising each idea seems. Respond with ONLY JSON matching this shape: {\"items\": [{\"rank\": 1, \"label\": \"Substitute\", \"weight\": 70, \"rationale\": \"...\"}], \"summary\": \"...\"}",
		"outputSchemaType": "ranked_list",
		"outputJsonSchema": {
			"type": "object",
			"required": ["items", "summary"],
			"properties": {
				"items": {
					"type": "array",
					"items": {
						"type": "object",
						"required": ["rank", "label", "weight", "rationale"],
						"properties": {
							"rank": { "type": "number" },
							"label": { "type": "string" },
							"weight": { "type": "number", "minimum": 0, "maximum": 100 },
							"rationale": { "type": "string" }
						}
					}
				},
				"summary": { "type": "string" }
			}
		},
		"chartComponent": "RankedListChart",
		"createdAt": "2026-08-22T00:00:00.000Z",
		"updatedAt": "2026-08-22T00:00:00.000Z"
	}
]
```

- [ ] **Step 2: Write the failing test for the seed function**

Create `src/lib/db/seed.test.ts`:

```ts
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { seedModelsIfEmpty } from './seed';

describe('seedModelsIfEmpty', () => {
	beforeEach(async () => {
		await db.models.clear();
	});

	it('inserts all 8 seed models when the table is empty', async () => {
		await seedModelsIfEmpty();
		const count = await db.models.count();
		expect(count).toBe(8);
	});

	it('does not duplicate models when called twice', async () => {
		await seedModelsIfEmpty();
		await seedModelsIfEmpty();
		const count = await db.models.count();
		expect(count).toBe(8);
	});

	it('seeds a model with the expected shape', async () => {
		await seedModelsIfEmpty();
		const model = await db.models.where('slug').equals('eisenhower-matrix').first();
		expect(model?.name).toBe('Eisenhower Matrix');
		expect(model?.outputSchemaType).toBe('quadrant2x2');
	});
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- seed.test.ts`
Expected: FAIL — `./seed` does not exist yet.

- [ ] **Step 4: Implement the seed function**

Create `src/lib/db/seed.ts`:

```ts
import { db } from '../db';
import type { ModelDef } from '../types';
import seedModels from './seed-models.json';

export async function seedModelsIfEmpty(): Promise<void> {
	const count = await db.models.count();
	if (count > 0) return;
	await db.models.bulkAdd(seedModels as ModelDef[]);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- seed.test.ts`
Expected: 3 passed.

- [ ] **Step 6: Commit**

```bash
git add src/lib/db/seed-models.json src/lib/db/seed.ts src/lib/db/seed.test.ts
git commit -m "feat: seed the 8 v1 decision models"
```

---

### Task 4: Models store

**Files:**
- Create: `src/lib/stores/models.ts`
- Create: `src/lib/stores/models.test.ts`

**Interfaces:**
- Consumes: `db` (Task 2), `ModelDef`/`Category` (Task 2), `seedModelsIfEmpty` (Task 3, used in tests only)
- Produces: `src/lib/stores/models.ts` exports `listModels(): Promise<ModelDef[]>`, `listModelsByCategory(category: Category): Promise<ModelDef[]>`, `getModelBySlug(slug: string): Promise<ModelDef | undefined>`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/stores/models.test.ts`:

```ts
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { seedModelsIfEmpty } from '../db/seed';
import { listModels, listModelsByCategory, getModelBySlug } from './models';

describe('models store', () => {
	beforeEach(async () => {
		await db.models.clear();
		await seedModelsIfEmpty();
	});

	it('lists all models', async () => {
		const models = await listModels();
		expect(models).toHaveLength(8);
	});

	it('filters models by category', async () => {
		const models = await listModelsByCategory('know-self');
		expect(models.map((m) => m.slug).sort()).toEqual(['cognitive-dissonance', 'johari-window']);
	});

	it('gets a single model by slug', async () => {
		const model = await getModelBySlug('swot-analysis');
		expect(model?.name).toBe('SWOT Analysis');
	});

	it('returns undefined for an unknown slug', async () => {
		const model = await getModelBySlug('does-not-exist');
		expect(model).toBeUndefined();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- models.test.ts`
Expected: FAIL — `./models` does not exist yet.

- [ ] **Step 3: Implement the store**

Create `src/lib/stores/models.ts`:

```ts
import { db } from '../db';
import type { Category, ModelDef } from '../types';

export async function listModels(): Promise<ModelDef[]> {
	return db.models.toArray();
}

export async function listModelsByCategory(category: Category): Promise<ModelDef[]> {
	return db.models.where('category').equals(category).toArray();
}

export async function getModelBySlug(slug: string): Promise<ModelDef | undefined> {
	return db.models.where('slug').equals(slug).first();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- models.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stores/models.ts src/lib/stores/models.test.ts
git commit -m "feat: add models store"
```

---

### Task 5: Questions store

**Files:**
- Create: `src/lib/stores/questions.ts`
- Create: `src/lib/stores/questions.test.ts`

**Interfaces:**
- Consumes: `db` (Task 2), `Question` (Task 2)
- Produces: `src/lib/stores/questions.ts` exports `createQuestion(text: string): Promise<Question>`, `listQuestions(): Promise<Question[]>` (newest first), `getQuestion(id: string): Promise<Question | undefined>`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/stores/questions.test.ts`:

```ts
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { createQuestion, listQuestions, getQuestion } from './questions';

describe('questions store', () => {
	beforeEach(async () => {
		await db.questions.clear();
	});

	it('creates a question with generated id and timestamp', async () => {
		const q = await createQuestion('Should I take the job?');
		expect(q.id).toBeTruthy();
		expect(q.text).toBe('Should I take the job?');
		expect(q.createdAt).toBeTruthy();
	});

	it('rejects an empty question', async () => {
		await expect(createQuestion('   ')).rejects.toThrow('Question text cannot be empty');
	});

	it('lists questions newest first', async () => {
		const first = await createQuestion('First question');
		await new Promise((r) => setTimeout(r, 5));
		const second = await createQuestion('Second question');
		const list = await listQuestions();
		expect(list.map((q) => q.id)).toEqual([second.id, first.id]);
	});

	it('gets a question by id', async () => {
		const created = await createQuestion('Should I move cities?');
		const found = await getQuestion(created.id);
		expect(found?.text).toBe('Should I move cities?');
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- questions.test.ts`
Expected: FAIL — `./questions` does not exist yet.

- [ ] **Step 3: Implement the store**

Create `src/lib/stores/questions.ts`:

```ts
import { db } from '../db';
import type { Question } from '../types';

export async function createQuestion(text: string): Promise<Question> {
	const trimmed = text.trim();
	if (!trimmed) {
		throw new Error('Question text cannot be empty');
	}
	const question: Question = {
		id: crypto.randomUUID(),
		text: trimmed,
		createdAt: new Date().toISOString()
	};
	await db.questions.add(question);
	return question;
}

export async function listQuestions(): Promise<Question[]> {
	const all = await db.questions.toArray();
	return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getQuestion(id: string): Promise<Question | undefined> {
	return db.questions.get(id);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- questions.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stores/questions.ts src/lib/stores/questions.test.ts
git commit -m "feat: add questions store"
```

---

### Task 6: Home page — question composer and list

**Files:**
- Create: `src/routes/+page.svelte`
- Create: `src/routes/+page.test.ts`

**Interfaces:**
- Consumes: `createQuestion`, `listQuestions` from `src/lib/stores/questions.ts` (Task 5)
- Produces: the `/` route, linking to `/question/[id]` (built in Task 8)

- [ ] **Step 1: Write the failing component test**

Create `src/routes/+page.test.ts`:

```ts
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { db } from '$lib/db';
import Page from './+page.svelte';

describe('/ page', () => {
	beforeEach(async () => {
		await db.questions.clear();
	});

	it('creates a question and shows it in the list', async () => {
		render(Page);

		const input = screen.getByPlaceholderText('What are you trying to decide?');
		await fireEvent.input(input, { target: { value: 'Should I take the job?' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Ask' }));

		expect(await screen.findByText('Should I take the job?')).toBeTruthy();
	});

	it('does not submit an empty question', async () => {
		render(Page);
		await fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
		const count = await db.questions.count();
		expect(count).toBe(0);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- +page.test.ts`
Expected: FAIL — `src/routes/+page.svelte` does not exist yet.

- [ ] **Step 3: Implement the page**

Create `src/routes/+page.svelte`:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { createQuestion, listQuestions } from '$lib/stores/questions';
	import type { Question } from '$lib/types';

	let questionText = $state('');
	let questions = $state<Question[]>([]);

	async function refresh() {
		questions = await listQuestions();
	}

	async function submit() {
		if (!questionText.trim()) return;
		await createQuestion(questionText);
		questionText = '';
		await refresh();
	}

	onMount(refresh);
</script>

<main class="mx-auto max-w-2xl px-6 py-16">
	<h1 class="text-3xl font-semibold tracking-tight text-slate-900">What are you deciding?</h1>
	<p class="mt-2 text-slate-500">
		Write the question or doubt you're weighing. Then pick a model to think it through.
	</p>

	<form
		class="mt-8 flex gap-3"
		onsubmit={(e) => {
			e.preventDefault();
			submit();
		}}
	>
		<input
			class="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-500 focus:outline-none"
			placeholder="What are you trying to decide?"
			bind:value={questionText}
		/>
		<button
			type="submit"
			class="rounded-lg bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-700"
		>
			Ask
		</button>
	</form>

	<ul class="mt-12 divide-y divide-slate-200">
		{#each questions as question (question.id)}
			<li>
				<a
					href={`/question/${question.id}`}
					class="block py-4 text-slate-800 hover:text-slate-500"
				>
					{question.text}
				</a>
			</li>
		{/each}
	</ul>

	{#if questions.length === 0}
		<p class="mt-12 text-slate-400">No questions yet.</p>
	{/if}
</main>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- +page.test.ts`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/routes/+page.svelte src/routes/+page.test.ts
git commit -m "feat: add home page with question composer and list"
```

---

### Task 7: Model library pages

**Files:**
- Create: `src/routes/models/+page.svelte`
- Create: `src/routes/models/+page.test.ts`
- Create: `src/routes/models/[slug]/+page.svelte`
- Create: `src/routes/models/[slug]/+page.test.ts`

**Interfaces:**
- Consumes: `listModels`, `getModelBySlug` from `src/lib/stores/models.ts` (Task 4); `seedModelsIfEmpty` from `src/lib/db/seed.ts` (Task 3, tests only); SvelteKit's `$app/stores`/`page` for the route param (via `$props()` — SvelteKit passes `data`/params through `$props()` in Svelte 5, but this page reads the slug directly from `page.params` since there's no server load function)
- Produces: `/models` and `/models/[slug]` routes, linking from `/question/[id]` in Task 8

- [ ] **Step 1: Write the failing test for the model list page**

Create `src/routes/models/+page.test.ts`:

```ts
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { db } from '$lib/db';
import { seedModelsIfEmpty } from '$lib/db/seed';
import Page from './+page.svelte';

describe('/models page', () => {
	beforeEach(async () => {
		await db.models.clear();
		await seedModelsIfEmpty();
	});

	it('lists all seeded models by name', async () => {
		render(Page);
		expect(await screen.findByText('Eisenhower Matrix')).toBeTruthy();
		expect(await screen.findByText('SWOT Analysis')).toBeTruthy();
		expect(await screen.findByText('SCAMPER')).toBeTruthy();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- models/+page.test.ts`
Expected: FAIL — `src/routes/models/+page.svelte` does not exist yet.

- [ ] **Step 3: Implement the model list page**

Create `src/routes/models/+page.svelte`:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { listModels } from '$lib/stores/models';
	import type { Category, ModelDef } from '$lib/types';

	const categoryLabels: Record<Category, string> = {
		'decision-making': 'Decision Making',
		'know-self': 'Knowing Yourself',
		'know-others': 'Knowing Others',
		'improve-others': 'Improving Others'
	};

	let models = $state<ModelDef[]>([]);

	onMount(async () => {
		models = await listModels();
	});

	let byCategory = $derived(
		(Object.keys(categoryLabels) as Category[]).map((category) => ({
			category,
			label: categoryLabels[category],
			models: models.filter((m) => m.category === category)
		}))
	);
</script>

<main class="mx-auto max-w-4xl px-6 py-16">
	<h1 class="text-3xl font-semibold tracking-tight text-slate-900">Model Library</h1>
	<p class="mt-2 text-slate-500">Every mental model available to analyze a question.</p>

	{#each byCategory as group (group.category)}
		{#if group.models.length > 0}
			<section class="mt-10">
				<h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">
					{group.label}
				</h2>
				<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
					{#each group.models as model (model.id)}
						<a
							href={`/models/${model.slug}`}
							class="rounded-xl border border-slate-200 p-5 hover:border-slate-400"
						>
							<h3 class="font-medium text-slate-900">{model.name}</h3>
							<p class="mt-1 text-sm text-slate-500">{model.description}</p>
						</a>
					{/each}
				</div>
			</section>
		{/if}
	{/each}
</main>
```

- [ ] **Step 4: Run test to verify the list page passes**

Run: `npm run test -- models/+page.test.ts`
Expected: 1 passed.

- [ ] **Step 5: Write the failing test for the model detail page**

Create `src/routes/models/[slug]/+page.test.ts`:

```ts
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { db } from '$lib/db';
import { seedModelsIfEmpty } from '$lib/db/seed';
import Page from './+page.svelte';

vi.mock('$app/state', () => ({
	page: { params: { slug: 'swot-analysis' } }
}));

describe('/models/[slug] page', () => {
	beforeEach(async () => {
		await db.models.clear();
		await seedModelsIfEmpty();
	});

	it('shows the model name, description, and when to use it', async () => {
		render(Page);
		expect(await screen.findByText('SWOT Analysis')).toBeTruthy();
		expect(
			await screen.findByText(
				'Breaks your question down into Strengths, Weaknesses, Opportunities and Threats.'
			)
		).toBeTruthy();
		expect(
			await screen.findByText(
				'Use when evaluating a plan, venture, or choice against both your own capabilities and the outside environment.'
			)
		).toBeTruthy();
	});
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm run test -- models/[slug]/+page.test.ts`
Expected: FAIL — `src/routes/models/[slug]/+page.svelte` does not exist yet.

- [ ] **Step 7: Implement the model detail page**

Create `src/routes/models/[slug]/+page.svelte`:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { getModelBySlug } from '$lib/stores/models';
	import type { ModelDef } from '$lib/types';

	let model = $state<ModelDef | undefined>(undefined);
	let notFound = $state(false);

	onMount(async () => {
		model = await getModelBySlug(page.params.slug);
		notFound = model === undefined;
	});
</script>

<main class="mx-auto max-w-2xl px-6 py-16">
	{#if model}
		<a href="/models" class="text-sm text-slate-400 hover:text-slate-600">&larr; All models</a>
		<h1 class="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{model.name}</h1>
		<p class="mt-4 text-slate-700">{model.description}</p>

		<h2 class="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">
			When to use it
		</h2>
		<p class="mt-2 text-slate-700">{model.whenToUse}</p>
	{:else if notFound}
		<p class="text-slate-500">Model not found.</p>
	{/if}
</main>
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm run test -- models/[slug]/+page.test.ts`
Expected: 1 passed.

- [ ] **Step 9: Commit**

```bash
git add src/routes/models
git commit -m "feat: add model library list and detail pages"
```

---

### Task 8: Question detail page

**Files:**
- Create: `src/routes/question/[id]/+page.svelte`
- Create: `src/routes/question/[id]/+page.test.ts`

**Interfaces:**
- Consumes: `getQuestion` from `src/lib/stores/questions.ts` (Task 5), `listModels` from `src/lib/stores/models.ts` (Task 4)
- Produces: the `/question/[id]` route. No "analyze" action yet — that button and its wiring are added together with the backend in the analysis-engine plan, so this task does not introduce it as a stub.

- [ ] **Step 1: Write the failing test**

Create `src/routes/question/[id]/+page.test.ts`:

```ts
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { db } from '$lib/db';
import { createQuestion } from '$lib/stores/questions';
import { seedModelsIfEmpty } from '$lib/db/seed';
import Page from './+page.svelte';

let questionId: string;

vi.mock('$app/state', () => ({
	get page() {
		return { params: { id: questionId } };
	}
}));

describe('/question/[id] page', () => {
	beforeEach(async () => {
		await db.questions.clear();
		await db.models.clear();
		await seedModelsIfEmpty();
		const q = await createQuestion('Should I take the job?');
		questionId = q.id;
	});

	it('shows the question text and the model picker grouped by category', async () => {
		render(Page);
		expect(await screen.findByText('Should I take the job?')).toBeTruthy();
		expect(await screen.findByText('Eisenhower Matrix')).toBeTruthy();
		expect(await screen.findByText('Johari Window')).toBeTruthy();
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- question/[id]/+page.test.ts`
Expected: FAIL — `src/routes/question/[id]/+page.svelte` does not exist yet.

- [ ] **Step 3: Implement the page**

Create `src/routes/question/[id]/+page.svelte`:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { getQuestion } from '$lib/stores/questions';
	import { listModels } from '$lib/stores/models';
	import type { Category, ModelDef, Question } from '$lib/types';

	const categoryLabels: Record<Category, string> = {
		'decision-making': 'Decision Making',
		'know-self': 'Knowing Yourself',
		'know-others': 'Knowing Others',
		'improve-others': 'Improving Others'
	};

	let question = $state<Question | undefined>(undefined);
	let models = $state<ModelDef[]>([]);

	onMount(async () => {
		question = await getQuestion(page.params.id);
		models = await listModels();
	});

	let byCategory = $derived(
		(Object.keys(categoryLabels) as Category[]).map((category) => ({
			category,
			label: categoryLabels[category],
			models: models.filter((m) => m.category === category)
		}))
	);
</script>

<main class="mx-auto max-w-2xl px-6 py-16">
	<a href="/" class="text-sm text-slate-400 hover:text-slate-600">&larr; All questions</a>

	{#if question}
		<h1 class="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{question.text}</h1>

		<h2 class="mt-10 text-sm font-semibold uppercase tracking-wide text-slate-400">
			Pick a model
		</h2>
		{#each byCategory as group (group.category)}
			{#if group.models.length > 0}
				<div class="mt-6">
					<h3 class="text-xs font-medium uppercase tracking-wide text-slate-400">
						{group.label}
					</h3>
					<div class="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
						{#each group.models as model (model.id)}
							<a
								href={`/models/${model.slug}`}
								class="rounded-lg border border-slate-200 p-4 hover:border-slate-400"
							>
								<p class="font-medium text-slate-900">{model.name}</p>
								<p class="mt-1 text-sm text-slate-500">{model.description}</p>
							</a>
						{/each}
					</div>
				</div>
			{/if}
		{/each}
	{/if}
</main>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- question/[id]/+page.test.ts`
Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add src/routes/question
git commit -m "feat: add question detail page with model picker"
```

---

### Task 9: Root layout — nav, seeding, and global styles

**Files:**
- Create: `src/routes/+layout.svelte`

**Interfaces:**
- Consumes: `seedModelsIfEmpty` from `src/lib/db/seed.ts` (Task 3)
- Produces: the app shell every route renders inside; nothing downstream depends on this file's internals, only on it existing and running `seedModelsIfEmpty` once on load

- [ ] **Step 1: Implement the layout**

Create `src/routes/+layout.svelte`:

```svelte
<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { seedModelsIfEmpty } from '$lib/db/seed';

	let { children } = $props();

	onMount(() => {
		seedModelsIfEmpty();
	});
</script>

<div class="min-h-screen bg-white">
	<header class="border-b border-slate-100">
		<nav class="mx-auto flex max-w-4xl items-center gap-6 px-6 py-4">
			<a href="/" class="font-semibold text-slate-900">Decision Copilot</a>
			<a href="/models" class="text-sm text-slate-500 hover:text-slate-900">Model Library</a>
		</nav>
	</header>
	{@render children()}
</div>
```

- [ ] **Step 2: Manual smoke test**

Run: `npm run dev`, open the app in a browser:
1. Confirm the home page loads with the question composer.
2. Type a question, submit, confirm it appears in the list and is clickable.
3. Click into the question, confirm all 8 models appear grouped by category.
4. Visit `/models`, confirm all 8 models are listed by category.
5. Click into a model, confirm its name, description, and "when to use" text render.
6. Reload the page — confirm the question and models persist (IndexedDB survived the reload).

- [ ] **Step 3: Run the full test suite**

Run: `npm run test`
Expected: all tests pass.

Run: `npm run check`
Expected: no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/routes/+layout.svelte
git commit -m "feat: add root layout with nav and model seeding"
```

---

## Self-Review Notes

- **Spec coverage:** local-first Dexie data layer (✅ Task 2), DB-driven model registry with description/when-to-use rendered generically (✅ Tasks 3, 7), question capture (✅ Tasks 5, 6), question detail with model picker grouped by the spec's four categories (✅ Task 8), 8 v1 seed models with real prompt templates and output JSON schemas per the spec's renderer table (✅ Task 3). LLM calls, D3 charts, auth, and sync are explicitly out of scope for this plan — they're plans 2 and 3.
- **Placeholder scan:** no TBD/TODO; every prompt template and JSON schema is fully written out; the "analyze" button is deliberately not stubbed (see Task 8's Interfaces note) rather than left as a placeholder.
- **Type consistency:** `ModelDef`, `Question`, `Analysis` defined once in Task 2 and referenced by name (not redefined) in every later task; `outputSchemaType` values in the seed data match the six-value union in Task 2 exactly; store function signatures (`listModels`, `listModelsByCategory`, `getModelBySlug`, `createQuestion`, `listQuestions`, `getQuestion`) are declared once in Tasks 4-5 and consumed with the same names/signatures in Tasks 6-8.

---

## What's Next

This plan does not include: LLM calls, D3 chart rendering, Cloudflare Pages Functions, Supabase, or auth. Those are the next two plans:

- **Plan 2 — Analysis engine:** `/api/analyze` backend route, pluggable LLM provider, JSON schema validation, the 7 D3 chart renderers, wiring the "analyze" action into `/question/[id]`.
- **Plan 3 — Auth & cloud sync:** Supabase schema + RLS, Google OAuth via Supabase Auth, `/settings` sync toggle, `/api/sync` push/pull with last-write-wins conflict resolution.
