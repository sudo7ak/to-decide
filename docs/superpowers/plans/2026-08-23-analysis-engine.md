# Analysis Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn a user's question + chosen model into a real LLM-generated analysis, rendered through the model's existing chart component, with full run history kept per question+model pair.

**Architecture:** A stateless `POST /api/analyze` Cloudflare Pages Function calls a pluggable `LlmProvider` (Gemini Flash first), validates the JSON response against the model's own `outputJsonSchema` with `ajv`, retrying once on validation failure. The client (question page) does the interpolation and owns all persistence — the route never touches Dexie.

**Tech Stack:** SvelteKit 2 (Svelte 5 runes) on `@sveltejs/adapter-cloudflare`, Dexie/IndexedDB, `ajv` (new dependency), Vitest + `@testing-library/svelte` + `fake-indexeddb`, Google Gemini API (`gemini-flash-latest`, REST).

**Spec:** `docs/superpowers/specs/2026-08-23-analysis-engine-design.md`

## Global Constraints

- `/api/analyze` is stateless — no Dexie access, no knowledge of `Question`/`Analysis` types. Client sends the fully-interpolated prompt and the target JSON schema.
- Provider is Google Gemini Flash only. One-method `LlmProvider` interface, no config/registry for providers that don't exist yet.
- All 52 seed schemas use only `type`/`properties`/`items`/`required`/`enum`/`minItems`/`maxItems`/`minimum`/`maximum` — forward `outputJsonSchema` to Gemini's `responseSchema` unmodified, no translation layer.
- Validation failure (parse error or schema violation) → retry once, then `502 { error: "validation_failed" }`. Provider/network failure → immediate `502 { error: "provider_unavailable" }`, no retry.
- History is kept, never overwritten — every analyze/re-analyze creates a new `Analysis` row.
- API key via `platform.env.GEMINI_API_KEY`. No `wrangler` CLI needed for local dev — `@sveltejs/adapter-cloudflare`'s `emulate()` hook wires `platform.env` under plain `vite dev`, reading `.dev.vars` (gitignored).
- No real Gemini calls in any automated test — mock `fetch`/`LlmProvider` throughout.
- Follow existing repo conventions exactly: Dexie stores are plain async functions over `db.<table>` (see `src/lib/stores/questions.ts`), tests use `fake-indexeddb/auto` + `vitest`, components use Svelte 5 runes (`$state`/`$derived`), commit after each task.

---

### Task 1: Chart registry extraction

**Files:**
- Create: `src/lib/charts/registry.ts`
- Create: `src/lib/charts/registry.test.ts`
- Modify: `src/routes/models/[slug]/+page.svelte`

**Interfaces:**
- Consumes: nothing new
- Produces: `src/lib/charts/registry.ts` exports `chartComponents: Record<string, Component>` (the 6 chart components keyed by their `chartComponent` string) — Task 6 imports this.

- [ ] **Step 1: Write the failing test**

Create `src/lib/charts/registry.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { chartComponents } from './registry';

describe('chart registry', () => {
	it('has exactly the 6 chart components used by the seed models', () => {
		expect(Object.keys(chartComponents).sort()).toEqual(
			[
				'FlowDiagramChart',
				'MatrixTableChart',
				'NarrativeChart',
				'Quadrant2x2Chart',
				'RadarChart',
				'RankedListChart'
			].sort()
		);
	});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- registry.test.ts`
Expected: FAIL — `registry.ts` does not exist yet.

- [ ] **Step 3: Implement the registry**

Create `src/lib/charts/registry.ts`:

```ts
import Quadrant2x2Chart from './Quadrant2x2Chart.svelte';
import MatrixTableChart from './MatrixTableChart.svelte';
import RankedListChart from './RankedListChart.svelte';
import FlowDiagramChart from './FlowDiagramChart.svelte';
import NarrativeChart from './NarrativeChart.svelte';
import RadarChart from './RadarChart.svelte';

export const chartComponents = {
	Quadrant2x2Chart,
	MatrixTableChart,
	RankedListChart,
	FlowDiagramChart,
	NarrativeChart,
	RadarChart
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- registry.test.ts`
Expected: 1 passed.

- [ ] **Step 5: Point the model page at the shared registry**

In `src/routes/models/[slug]/+page.svelte`, delete these lines:

```ts
import Quadrant2x2Chart from '$lib/charts/Quadrant2x2Chart.svelte';
import MatrixTableChart from '$lib/charts/MatrixTableChart.svelte';
import RankedListChart from '$lib/charts/RankedListChart.svelte';
import FlowDiagramChart from '$lib/charts/FlowDiagramChart.svelte';
import NarrativeChart from '$lib/charts/NarrativeChart.svelte';
import RadarChart from '$lib/charts/RadarChart.svelte';

const chartComponents = {
	Quadrant2x2Chart,
	MatrixTableChart,
	RankedListChart,
	FlowDiagramChart,
	NarrativeChart,
	RadarChart
};
```

and replace them with:

```ts
import { chartComponents } from '$lib/charts/registry';
```

The line `model ? chartComponents[model.chartComponent as keyof typeof chartComponents] : undefined`
stays exactly as-is — only where `chartComponents` comes from changes.

- [ ] **Step 6: Run the existing model page tests to confirm no regression**

Run: `npm run test -- src/routes/models`
Expected: all existing tests (`page.test.ts`, `page-radar.test.ts`) still pass.

- [ ] **Step 7: Commit**

```bash
git add src/lib/charts/registry.ts src/lib/charts/registry.test.ts "src/routes/models/[slug]/+page.svelte"
git commit -m "refactor: extract chart component registry"
```

---

### Task 2: JSON schema validation helper

**Files:**
- Create: `src/lib/server/validation.ts`
- Create: `src/lib/server/validation.test.ts`

**Interfaces:**
- Consumes: nothing new
- Produces: `isValidAgainstSchema(schema: Record<string, unknown>, data: unknown): boolean` — Task 4's route handler calls this.

- [ ] **Step 1: Install ajv**

```bash
npm install ajv
```

- [ ] **Step 2: Write the failing test**

Create `src/lib/server/validation.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import seedModels from '../db/seed-models.json';
import { isValidAgainstSchema } from './validation';
import type { ModelDef } from '../types';

const models = seedModels as unknown as ModelDef[];

function modelBySlug(slug: string): ModelDef {
	const model = models.find((m) => m.slug === slug);
	if (!model) throw new Error(`fixture model not found: ${slug}`);
	return model;
}

describe('isValidAgainstSchema', () => {
	it('accepts the eisenhower-matrix (quadrant2x2) worked example', () => {
		const model = modelBySlug('eisenhower-matrix');
		expect(isValidAgainstSchema(model.outputJsonSchema, model.example.result)).toBe(true);
	});

	it('accepts the energy-model (radar) worked example', () => {
		const model = modelBySlug('energy-model');
		expect(isValidAgainstSchema(model.outputJsonSchema, model.example.result)).toBe(true);
	});

	it('accepts the swot-analysis (matrix_table) worked example', () => {
		const model = modelBySlug('swot-analysis');
		expect(isValidAgainstSchema(model.outputJsonSchema, model.example.result)).toBe(true);
	});

	it('rejects data missing a required field', () => {
		const model = modelBySlug('eisenhower-matrix');
		expect(isValidAgainstSchema(model.outputJsonSchema, { xAxisLabel: 'Urgency' })).toBe(false);
	});

	it('rejects data with the wrong type for a field', () => {
		const model = modelBySlug('swot-analysis');
		expect(isValidAgainstSchema(model.outputJsonSchema, { rows: 'not-an-array', summary: 'x' })).toBe(
			false
		);
	});
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- validation.test.ts`
Expected: FAIL — `validation.ts` does not exist yet.

- [ ] **Step 4: Implement the validator**

Create `src/lib/server/validation.ts`:

```ts
import Ajv from 'ajv';

export function isValidAgainstSchema(schema: Record<string, unknown>, data: unknown): boolean {
	const ajv = new Ajv({ allErrors: true });
	const validate = ajv.compile(schema);
	return validate(data) === true;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- validation.test.ts`
Expected: 5 passed.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/server/validation.ts src/lib/server/validation.test.ts
git commit -m "feat: add JSON schema validation helper"
```

---

### Task 3: LlmProvider interface and GeminiProvider

**Files:**
- Create: `src/lib/server/llm/provider.ts`
- Create: `src/lib/server/llm/gemini.ts`
- Create: `src/lib/server/llm/gemini.test.ts`

**Interfaces:**
- Consumes: nothing new
- Produces:
  - `src/lib/server/llm/provider.ts` exports `interface LlmProvider { generateJson(prompt: string, schema: Record<string, unknown>): Promise<Record<string, unknown>> }`, `class ProviderUnavailableError extends Error`, `class ProviderOutputError extends Error`
  - `src/lib/server/llm/gemini.ts` exports `class GeminiProvider implements LlmProvider` with constructor `(apiKey: string)`
  - Task 4 imports all of the above.

- [ ] **Step 1: Write the provider interface and error types**

Create `src/lib/server/llm/provider.ts`:

```ts
export interface LlmProvider {
	generateJson(prompt: string, schema: Record<string, unknown>): Promise<Record<string, unknown>>;
}

/** The provider itself is down or unreachable — not retried by the route. */
export class ProviderUnavailableError extends Error {}

/** The provider responded, but the output couldn't be parsed as JSON. */
export class ProviderOutputError extends Error {}
```

- [ ] **Step 2: Write the failing tests for GeminiProvider**

Create `src/lib/server/llm/gemini.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { GeminiProvider } from './gemini';
import { ProviderUnavailableError, ProviderOutputError } from './provider';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('GeminiProvider', () => {
	it('parses JSON out of the first text part', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					candidates: [{ content: { parts: [{ text: '{"summary":"ok"}' }] } }]
				})
			})
		);
		const provider = new GeminiProvider('test-key');
		const result = await provider.generateJson('prompt', { type: 'object' });
		expect(result).toEqual({ summary: 'ok' });
	});

	it('sends the prompt, schema, and API key in the request', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ candidates: [{ content: { parts: [{ text: '{}' }] } }] })
		});
		vi.stubGlobal('fetch', fetchMock);
		const provider = new GeminiProvider('test-key');
		const schema = { type: 'object', required: ['summary'] };
		await provider.generateJson('Should I take the job?', schema);

		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toContain('generateContent');
		expect(init.headers['X-goog-api-key']).toBe('test-key');
		const body = JSON.parse(init.body);
		expect(body.contents[0].parts[0].text).toBe('Should I take the job?');
		expect(body.generationConfig.responseSchema).toEqual(schema);
		expect(body.generationConfig.responseMimeType).toBe('application/json');
	});

	it('throws ProviderUnavailableError when the HTTP response is not ok', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
		const provider = new GeminiProvider('test-key');
		await expect(provider.generateJson('prompt', {})).rejects.toBeInstanceOf(
			ProviderUnavailableError
		);
	});

	it('throws ProviderUnavailableError when fetch itself rejects', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
		const provider = new GeminiProvider('test-key');
		await expect(provider.generateJson('prompt', {})).rejects.toBeInstanceOf(
			ProviderUnavailableError
		);
	});

	it('throws ProviderOutputError when no text part is present', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ candidates: [{ content: { parts: [{}] } }] })
			})
		);
		const provider = new GeminiProvider('test-key');
		await expect(provider.generateJson('prompt', {})).rejects.toBeInstanceOf(ProviderOutputError);
	});

	it('throws ProviderOutputError when the text part is not valid JSON', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ candidates: [{ content: { parts: [{ text: 'not json' }] } }] })
			})
		);
		const provider = new GeminiProvider('test-key');
		await expect(provider.generateJson('prompt', {})).rejects.toBeInstanceOf(ProviderOutputError);
	});
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run test -- gemini.test.ts`
Expected: FAIL — `gemini.ts` does not exist yet.

- [ ] **Step 4: Implement GeminiProvider**

Create `src/lib/server/llm/gemini.ts`:

```ts
import type { LlmProvider } from './provider';
import { ProviderUnavailableError, ProviderOutputError } from './provider';

const GEMINI_URL =
	'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

export class GeminiProvider implements LlmProvider {
	constructor(private apiKey: string) {}

	async generateJson(
		prompt: string,
		schema: Record<string, unknown>
	): Promise<Record<string, unknown>> {
		let res: Response;
		try {
			res = await fetch(GEMINI_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-goog-api-key': this.apiKey
				},
				body: JSON.stringify({
					contents: [{ parts: [{ text: prompt }] }],
					generationConfig: {
						responseMimeType: 'application/json',
						responseSchema: schema
					}
				})
			});
		} catch {
			throw new ProviderUnavailableError('Gemini request failed: network error');
		}

		if (!res.ok) {
			throw new ProviderUnavailableError(`Gemini request failed with status ${res.status}`);
		}

		const data = (await res.json()) as {
			candidates?: { content?: { parts?: { text?: string }[] } }[];
		};
		const text = data.candidates?.[0]?.content?.parts?.find(
			(p): p is { text: string } => typeof p.text === 'string'
		)?.text;

		if (!text) {
			throw new ProviderOutputError('Gemini response contained no text part');
		}

		try {
			return JSON.parse(text) as Record<string, unknown>;
		} catch {
			throw new ProviderOutputError('Gemini response was not valid JSON');
		}
	}
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test -- gemini.test.ts`
Expected: 6 passed.

- [ ] **Step 6: Commit**

```bash
git add src/lib/server/llm/provider.ts src/lib/server/llm/gemini.ts src/lib/server/llm/gemini.test.ts
git commit -m "feat: add LlmProvider interface and GeminiProvider"
```

---

### Task 4: POST /api/analyze route

**Files:**
- Modify: `src/app.d.ts`
- Create: `.dev.vars.example`
- Modify: `.gitignore`
- Create: `src/routes/api/analyze/handler.ts`
- Create: `src/routes/api/analyze/handler.test.ts`
- Create: `src/routes/api/analyze/+server.ts`

**Interfaces:**
- Consumes: `LlmProvider`, `ProviderUnavailableError`, `ProviderOutputError` from Task 3; `isValidAgainstSchema` from Task 2
- Produces: `POST /api/analyze` accepting `{ promptTemplate: string, outputJsonSchema: Record<string, unknown> }`, responding `200 { resultJson: Record<string, unknown> }` or `502 { error: "validation_failed" | "provider_unavailable" }` — Task 6 calls this via `fetch`.

- [ ] **Step 1: Type the Cloudflare platform env binding**

Modify `src/app.d.ts`:

```ts
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		interface Platform {
			env: {
				GEMINI_API_KEY: string;
			};
		}
		// interface PageData {}
		// interface PageState {}
	}
}

export {};
```

- [ ] **Step 2: Add local dev env var scaffolding**

Create `.dev.vars.example`:

```
GEMINI_API_KEY=your-gemini-api-key-here
```

Add to `.gitignore` (in the `# Env` section, alongside the existing `.env` entries):

```
.dev.vars
```

Then locally (not committed): copy `.dev.vars.example` to `.dev.vars` and fill in a real key. `@sveltejs/adapter-cloudflare` makes it available as `platform.env.GEMINI_API_KEY` under plain `npm run dev` — no `wrangler` CLI needed.

- [ ] **Step 3: Write the failing tests for the route handler**

Create `src/routes/api/analyze/handler.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import type { RequestHandler } from '@sveltejs/kit';
import { createAnalyzeHandler } from './handler';
import type { LlmProvider } from '$lib/server/llm/provider';
import { ProviderUnavailableError } from '$lib/server/llm/provider';

const validSchema = {
	type: 'object',
	required: ['summary'],
	properties: { summary: { type: 'string' } }
};

function makeEvent(
	body: unknown,
	apiKey: string | undefined
): Parameters<RequestHandler>[0] {
	return {
		request: new Request('http://localhost/api/analyze', {
			method: 'POST',
			body: JSON.stringify(body)
		}),
		platform: apiKey ? { env: { GEMINI_API_KEY: apiKey } } : undefined
	} as Parameters<RequestHandler>[0];
}

function mockProvider(generateJson: LlmProvider['generateJson']): LlmProvider {
	return { generateJson };
}

describe('createAnalyzeHandler', () => {
	it('returns 200 with resultJson when the first attempt validates', async () => {
		const generateJson = vi.fn().mockResolvedValue({ summary: 'ok' });
		const handler = createAnalyzeHandler(() => mockProvider(generateJson));

		const res = await handler(
			makeEvent({ promptTemplate: 'p', outputJsonSchema: validSchema }, 'key')
		);

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ resultJson: { summary: 'ok' } });
		expect(generateJson).toHaveBeenCalledTimes(1);
	});

	it('retries once when the first attempt fails validation, then succeeds', async () => {
		const generateJson = vi
			.fn()
			.mockResolvedValueOnce({ wrong: 'shape' })
			.mockResolvedValueOnce({ summary: 'ok' });
		const handler = createAnalyzeHandler(() => mockProvider(generateJson));

		const res = await handler(
			makeEvent({ promptTemplate: 'p', outputJsonSchema: validSchema }, 'key')
		);

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ resultJson: { summary: 'ok' } });
		expect(generateJson).toHaveBeenCalledTimes(2);
	});

	it('returns 502 validation_failed when both attempts fail validation', async () => {
		const generateJson = vi.fn().mockResolvedValue({ wrong: 'shape' });
		const handler = createAnalyzeHandler(() => mockProvider(generateJson));

		const res = await handler(
			makeEvent({ promptTemplate: 'p', outputJsonSchema: validSchema }, 'key')
		);

		expect(res.status).toBe(502);
		expect(await res.json()).toEqual({ error: 'validation_failed' });
		expect(generateJson).toHaveBeenCalledTimes(2);
	});

	it('returns 502 provider_unavailable immediately, without retrying', async () => {
		const generateJson = vi.fn().mockRejectedValue(new ProviderUnavailableError('down'));
		const handler = createAnalyzeHandler(() => mockProvider(generateJson));

		const res = await handler(
			makeEvent({ promptTemplate: 'p', outputJsonSchema: validSchema }, 'key')
		);

		expect(res.status).toBe(502);
		expect(await res.json()).toEqual({ error: 'provider_unavailable' });
		expect(generateJson).toHaveBeenCalledTimes(1);
	});

	it('throws a 500 error when GEMINI_API_KEY is not configured', async () => {
		const generateJson = vi.fn();
		const handler = createAnalyzeHandler(() => mockProvider(generateJson));

		await expect(
			handler(makeEvent({ promptTemplate: 'p', outputJsonSchema: validSchema }, undefined))
		).rejects.toMatchObject({ status: 500 });
		expect(generateJson).not.toHaveBeenCalled();
	});
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm run test -- handler.test.ts`
Expected: FAIL — `handler.ts` does not exist yet.

- [ ] **Step 5: Implement the route handler**

Create `src/routes/api/analyze/handler.ts`:

```ts
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import type { LlmProvider } from '$lib/server/llm/provider';
import { ProviderUnavailableError } from '$lib/server/llm/provider';
import { isValidAgainstSchema } from '$lib/server/validation';

interface AnalyzeRequestBody {
	promptTemplate: string;
	outputJsonSchema: Record<string, unknown>;
}

type AttemptResult =
	| { ok: true; resultJson: Record<string, unknown> }
	| { ok: false; kind: 'provider_unavailable' | 'validation_failed' };

async function attempt(provider: LlmProvider, body: AnalyzeRequestBody): Promise<AttemptResult> {
	let resultJson: Record<string, unknown>;
	try {
		resultJson = await provider.generateJson(body.promptTemplate, body.outputJsonSchema);
	} catch (err) {
		if (err instanceof ProviderUnavailableError) {
			return { ok: false, kind: 'provider_unavailable' };
		}
		return { ok: false, kind: 'validation_failed' };
	}

	if (isValidAgainstSchema(body.outputJsonSchema, resultJson)) {
		return { ok: true, resultJson };
	}
	return { ok: false, kind: 'validation_failed' };
}

export function createAnalyzeHandler(makeProvider: (apiKey: string) => LlmProvider): RequestHandler {
	return async (event) => {
		const apiKey = event.platform?.env.GEMINI_API_KEY;
		if (!apiKey) {
			throw error(500, 'GEMINI_API_KEY is not configured');
		}

		const body = (await event.request.json()) as AnalyzeRequestBody;
		const provider = makeProvider(apiKey);

		const first = await attempt(provider, body);
		if (first.ok) {
			return json({ resultJson: first.resultJson });
		}
		if (first.kind === 'provider_unavailable') {
			return json({ error: 'provider_unavailable' }, { status: 502 });
		}

		const second = await attempt(provider, body);
		if (second.ok) {
			return json({ resultJson: second.resultJson });
		}
		return json({ error: second.kind }, { status: 502 });
	};
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm run test -- handler.test.ts`
Expected: 5 passed.

- [ ] **Step 7: Wire the real provider into the route**

Create `src/routes/api/analyze/+server.ts`:

```ts
import { GeminiProvider } from '$lib/server/llm/gemini';
import { createAnalyzeHandler } from './handler';

export const POST = createAnalyzeHandler((apiKey) => new GeminiProvider(apiKey));
```

- [ ] **Step 8: Commit**

```bash
git add src/app.d.ts .dev.vars.example .gitignore src/routes/api/analyze
git commit -m "feat: add POST /api/analyze route"
```

---

### Task 5: Analyses store

**Files:**
- Create: `src/lib/stores/analyses.ts`
- Create: `src/lib/stores/analyses.test.ts`

**Interfaces:**
- Consumes: `db` from `src/lib/db.ts`, `Analysis` from `src/lib/types.ts` (both already exist)
- Produces: `createAnalysis(questionId: string, modelId: string, resultJson: Record<string, unknown>): Promise<Analysis>`, `listAnalysesForQuestionAndModel(questionId: string, modelId: string): Promise<Analysis[]>` (newest first) — Task 6 calls both.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/stores/analyses.test.ts`:

```ts
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db';
import { createAnalysis, listAnalysesForQuestionAndModel } from './analyses';

describe('analyses store', () => {
	beforeEach(async () => {
		await db.analyses.clear();
	});

	it('creates an analysis with a generated id and timestamps', async () => {
		const a = await createAnalysis('q1', 'm1', { summary: 'ok' });
		expect(a.id).toBeTruthy();
		expect(a.questionId).toBe('q1');
		expect(a.modelId).toBe('m1');
		expect(a.resultJson).toEqual({ summary: 'ok' });
		expect(a.createdAt).toBeTruthy();
		expect(a.syncedAt).toBeNull();
	});

	it('lists analyses for a question+model pair, newest first', async () => {
		const first = await createAnalysis('q1', 'm1', { summary: 'first' });
		await new Promise((r) => setTimeout(r, 5));
		const second = await createAnalysis('q1', 'm1', { summary: 'second' });
		const list = await listAnalysesForQuestionAndModel('q1', 'm1');
		expect(list.map((a) => a.id)).toEqual([second.id, first.id]);
	});

	it('does not mix analyses from a different model on the same question', async () => {
		await createAnalysis('q1', 'm1', { summary: 'for m1' });
		await createAnalysis('q1', 'm2', { summary: 'for m2' });
		const list = await listAnalysesForQuestionAndModel('q1', 'm1');
		expect(list).toHaveLength(1);
		expect(list[0].resultJson).toEqual({ summary: 'for m1' });
	});

	it('does not mix analyses from a different question with the same model', async () => {
		await createAnalysis('q1', 'm1', { summary: 'for q1' });
		await createAnalysis('q2', 'm1', { summary: 'for q2' });
		const list = await listAnalysesForQuestionAndModel('q1', 'm1');
		expect(list).toHaveLength(1);
		expect(list[0].resultJson).toEqual({ summary: 'for q1' });
	});
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- analyses.test.ts`
Expected: FAIL — `analyses.ts` does not exist yet.

- [ ] **Step 3: Implement the store**

Create `src/lib/stores/analyses.ts`:

```ts
import { db } from '../db';
import type { Analysis } from '../types';

export async function createAnalysis(
	questionId: string,
	modelId: string,
	resultJson: Record<string, unknown>
): Promise<Analysis> {
	const now = new Date().toISOString();
	const analysis: Analysis = {
		id: crypto.randomUUID(),
		questionId,
		modelId,
		resultJson,
		createdAt: now,
		updatedAt: now,
		syncedAt: null
	};
	await db.analyses.add(analysis);
	return analysis;
}

export async function listAnalysesForQuestionAndModel(
	questionId: string,
	modelId: string
): Promise<Analysis[]> {
	const forQuestion = await db.analyses.where('questionId').equals(questionId).toArray();
	return forQuestion
		.filter((a) => a.modelId === modelId)
		.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- analyses.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stores/analyses.ts src/lib/stores/analyses.test.ts
git commit -m "feat: add analyses store"
```

---

### Task 6: Wire analyze into the question page

**Files:**
- Modify: `src/routes/question/[id]/+page.svelte`
- Modify: `src/routes/question/[id]/page.test.ts`

**Interfaces:**
- Consumes: `chartComponents` (Task 1), `createAnalysis`/`listAnalysesForQuestionAndModel` (Task 5), `POST /api/analyze` (Task 4), existing `getQuestion`/`listModels`
- Produces: nothing consumed by a later task — this is the last task in the plan.

- [ ] **Step 1: Write the failing tests**

Modify `src/routes/question/[id]/page.test.ts` — add `afterEach` to the
import line and 5 new test cases after the existing 2:

```ts
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';
import { db } from '$lib/db';
import { createQuestion } from '$lib/stores/questions';
import { createAnalysis } from '$lib/stores/analyses';
import { syncSeedModels } from '$lib/db/seed';
import seedModels from '$lib/db/seed-models.json';
import type { ModelDef } from '$lib/types';
import Page from './+page.svelte';

let questionId: string;

vi.mock('$app/state', () => ({
	get page() {
		return { params: { id: questionId } };
	}
}));

const eisenhower = (seedModels as unknown as ModelDef[]).find(
	(m) => m.slug === 'eisenhower-matrix'
)!;

// The question page renders one "Analyze" toggle per model card, so an
// unscoped `getByRole('button', { name: 'Analyze' })` is ambiguous — every
// query below is scoped to this one card via `within`.
function eisenhowerCard() {
	return within(screen.getByTestId(`model-card-${eisenhower.slug}`));
}

describe('/question/[id] page', () => {
	beforeEach(async () => {
		await db.questions.clear();
		await db.models.clear();
		await db.analyses.clear();
		await syncSeedModels();
		const q = await createQuestion('Should I take the job?');
		questionId = q.id;
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('shows the question text and the model picker grouped by category', async () => {
		render(Page);
		expect(await screen.findByText('Should I take the job?')).toBeTruthy();
		expect(await screen.findByText('Eisenhower Matrix')).toBeTruthy();
		expect(await screen.findByText('Johari Window')).toBeTruthy();
	});

	it('shows a not-found message for an unknown question id', async () => {
		questionId = 'does-not-exist';
		render(Page);
		expect(await screen.findByText('Question not found.')).toBeTruthy();
	});

	it('shows an Analyze button when a model card is expanded with no history', async () => {
		render(Page);
		await screen.findByTestId(`model-card-${eisenhower.slug}`);
		await fireEvent.click(eisenhowerCard().getByRole('button', { name: 'Analyze' }));
		expect(eisenhowerCard().getByRole('button', { name: 'Analyze' })).toBeTruthy();
	});

	it('calls /api/analyze and renders the chart on a successful analyze', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ resultJson: eisenhower.example.result })
			})
		);
		render(Page);
		await screen.findByTestId(`model-card-${eisenhower.slug}`);
		// 1st click expands the card (toggle reads "Analyze" while collapsed);
		// 2nd click hits the now-revealed inline action button, also "Analyze".
		await fireEvent.click(eisenhowerCard().getByRole('button', { name: 'Analyze' }));
		await fireEvent.click(eisenhowerCard().getByRole('button', { name: 'Analyze' }));

		expect(await eisenhowerCard().findByText('Resolve the client emergency')).toBeTruthy();
		const stored = await db.analyses.where('questionId').equals(questionId).toArray();
		expect(stored).toHaveLength(1);
		expect(stored[0].resultJson).toEqual(eisenhower.example.result);
	});

	it('shows past runs and switches between them', async () => {
		await createAnalysis(questionId, eisenhower.id, {
			...eisenhower.example.result,
			summary: 'older run'
		});
		await new Promise((r) => setTimeout(r, 5));
		await createAnalysis(questionId, eisenhower.id, {
			...eisenhower.example.result,
			summary: 'newer run'
		});

		render(Page);
		await screen.findByTestId(`model-card-${eisenhower.slug}`);
		await fireEvent.click(eisenhowerCard().getByRole('button', { name: 'Analyze' }));

		expect(await eisenhowerCard().findByText('newer run')).toBeTruthy();
		const timestampButtons = eisenhowerCard()
			.getAllByRole('button')
			.filter((b) => b.textContent?.match(/\d{1,2}:\d{2}/));
		expect(timestampButtons).toHaveLength(2);

		await fireEvent.click(timestampButtons[1]);
		expect(await eisenhowerCard().findByText('older run')).toBeTruthy();
	});

	it('shows an error and a retry option when the request fails', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502 }));
		render(Page);
		await screen.findByTestId(`model-card-${eisenhower.slug}`);
		await fireEvent.click(eisenhowerCard().getByRole('button', { name: 'Analyze' }));
		await fireEvent.click(eisenhowerCard().getByRole('button', { name: 'Analyze' }));

		expect(await eisenhowerCard().findByText(/Analysis failed/)).toBeTruthy();
		expect(eisenhowerCard().getByRole('button', { name: 'Try again' })).toBeTruthy();
	});
});
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npm run test -- "src/routes/question/[id]/page.test.ts"`
Expected: the 2 existing tests still pass; the 5 new ones FAIL (no Analyze
button exists yet).

- [ ] **Step 3: Rebuild the question page with the accordion**

Replace `src/routes/question/[id]/+page.svelte` entirely:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { getQuestion } from '$lib/stores/questions';
	import { listModels } from '$lib/stores/models';
	import { createAnalysis, listAnalysesForQuestionAndModel } from '$lib/stores/analyses';
	import { chartComponents } from '$lib/charts/registry';
	import type { Analysis, Category, ModelDef, Question } from '$lib/types';

	const categoryLabels: Record<Category, string> = {
		'decision-making': 'Decision Making',
		'know-self': 'Knowing Yourself',
		'know-others': 'Knowing Others',
		'improve-others': 'Improving Others'
	};

	let question = $state<Question | undefined>(undefined);
	let models = $state<ModelDef[]>([]);
	let notFound = $state(false);

	let expandedModelId = $state<string | null>(null);
	let analysesByModel = $state<Record<string, Analysis[]>>({});
	let activeAnalysisId = $state<Record<string, string>>({});
	let loadingModelId = $state<string | null>(null);
	let errorModelId = $state<string | null>(null);

	onMount(async () => {
		const id = page.params.id;
		if (!id) return;
		question = await getQuestion(id);
		notFound = question === undefined;
		models = await listModels();
	});

	let byCategory = $derived(
		(Object.keys(categoryLabels) as Category[]).map((category) => ({
			category,
			label: categoryLabels[category],
			models: models.filter((m) => m.category === category)
		}))
	);

	let expandedModel = $derived(models.find((m) => m.id === expandedModelId));
	let activeAnalysis = $derived(
		expandedModel
			? analysesByModel[expandedModel.id]?.find(
					(a) => a.id === activeAnalysisId[expandedModel.id]
				)
			: undefined
	);
	let ActiveChart = $derived(
		expandedModel
			? chartComponents[expandedModel.chartComponent as keyof typeof chartComponents]
			: undefined
	);

	function formatTimestamp(iso: string): string {
		return new Date(iso).toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	async function toggleExpand(model: ModelDef) {
		if (expandedModelId === model.id) {
			expandedModelId = null;
			return;
		}
		expandedModelId = model.id;
		errorModelId = null;
		if (!analysesByModel[model.id]) {
			const list = await listAnalysesForQuestionAndModel(question!.id, model.id);
			analysesByModel = { ...analysesByModel, [model.id]: list };
			if (list.length > 0) {
				activeAnalysisId = { ...activeAnalysisId, [model.id]: list[0].id };
			}
		}
	}

	async function runAnalysis(model: ModelDef) {
		if (!question) return;
		loadingModelId = model.id;
		errorModelId = null;
		try {
			const prompt = model.promptTemplate.replaceAll('{{question}}', question.text);
			const res = await fetch('/api/analyze', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ promptTemplate: prompt, outputJsonSchema: model.outputJsonSchema })
			});
			if (!res.ok) throw new Error('analyze request failed');
			const { resultJson } = (await res.json()) as { resultJson: Record<string, unknown> };
			const created = await createAnalysis(question.id, model.id, resultJson);
			analysesByModel = {
				...analysesByModel,
				[model.id]: [created, ...(analysesByModel[model.id] ?? [])]
			};
			activeAnalysisId = { ...activeAnalysisId, [model.id]: created.id };
		} catch {
			errorModelId = model.id;
		} finally {
			loadingModelId = null;
		}
	}
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
							<div
								class="rounded-lg border border-slate-200 p-4"
								data-testid={`model-card-${model.slug}`}
							>
								<div class="flex items-start justify-between gap-2">
									<a href={`/models/${model.slug}`} class="font-medium text-slate-900 hover:underline">
										{model.name}
									</a>
									<button
										type="button"
										class="shrink-0 text-sm text-slate-500 hover:text-slate-900"
										onclick={() => toggleExpand(model)}
									>
										{expandedModelId === model.id ? 'Hide' : 'Analyze'}
									</button>
								</div>
								<p class="mt-1 text-sm text-slate-500">{model.description}</p>

								{#if expandedModelId === model.id}
									<div class="mt-4 border-t border-slate-100 pt-4">
										{#if !analysesByModel[model.id]?.length}
											<button
												type="button"
												class="rounded bg-slate-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
												disabled={loadingModelId === model.id}
												onclick={() => runAnalysis(model)}
											>
												{loadingModelId === model.id ? 'Analyzing…' : 'Analyze'}
											</button>
										{:else}
											<div class="flex flex-wrap gap-2 text-xs">
												{#each analysesByModel[model.id] as run (run.id)}
													<button
														type="button"
														class={activeAnalysisId[model.id] === run.id
															? 'font-semibold text-slate-900'
															: 'text-slate-400 hover:text-slate-600'}
														onclick={() =>
															(activeAnalysisId = { ...activeAnalysisId, [model.id]: run.id })}
													>
														{formatTimestamp(run.createdAt)}
													</button>
												{/each}
											</div>

											{#if expandedModelId === model.id && ActiveChart && activeAnalysis}
												<div class="mt-3">
													<ActiveChart data={activeAnalysis.resultJson as never} />
												</div>
											{/if}

											<button
												type="button"
												class="mt-3 rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
												disabled={loadingModelId === model.id}
												onclick={() => runAnalysis(model)}
											>
												{loadingModelId === model.id ? 'Analyzing…' : 'Re-analyze'}
											</button>
										{/if}

										{#if errorModelId === model.id}
											<p class="mt-2 text-sm text-red-600">
												Analysis failed.
												<button
													type="button"
													class="underline"
													onclick={() => runAnalysis(model)}
												>
													Try again
												</button>
											</p>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/each}
	{:else if notFound}
		<p class="mt-4 text-slate-500">Question not found.</p>
	{/if}
</main>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- "src/routes/question/[id]/page.test.ts"`
Expected: 7 passed.

- [ ] **Step 5: Run the full test suite**

Run: `npm run test`
Expected: all tests pass, no regressions in other routes/stores.

- [ ] **Step 6: Type-check**

Run: `npm run check`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add "src/routes/question/[id]/+page.svelte" "src/routes/question/[id]/page.test.ts"
git commit -m "feat: wire analyze action into the question page"
```

---

## Self-Review Notes

- **Spec coverage:** stateless `/api/analyze` (✅ Task 4), `GeminiProvider`/`LlmProvider` (✅ Task 3), ajv validation with retry-once-then-502 semantics, `provider_unavailable` vs `validation_failed` distinguished (✅ Tasks 3–4), chart registry reused instead of duplicated (✅ Task 1), analyses store with `createAnalysis`/`listAnalysesForQuestionAndModel` (✅ Task 5), question-page accordion with Analyze/Re-analyze, history switching, loading/error states (✅ Task 6), `platform.env.GEMINI_API_KEY` + `.dev.vars` + `App.Platform` typing (✅ Task 4), no real Gemini calls in any test (✅ all tasks mock `fetch`/`LlmProvider`).
- **Placeholder scan:** no TBD/TODO; every step has runnable code; test fixtures reuse real seed data (`model.example.result`) rather than inventing throwaway shapes.
- **Type consistency:** `LlmProvider.generateJson(prompt: string, schema: Record<string, unknown>): Promise<Record<string, unknown>>` defined once in Task 3, implemented identically by `GeminiProvider` and every test's `mockProvider`; `isValidAgainstSchema(schema, data): boolean` defined in Task 2, consumed with the same signature in Task 4; `createAnalysis`/`listAnalysesForQuestionAndModel` defined in Task 5 with the exact signatures Task 6 calls; `chartComponents` produced in Task 1 is imported by name, unchanged, in Task 6.

---

## What's Next

This plan does not include: Supabase, Google OAuth, `/settings`, or
cross-device sync. That's plan 3 — see plan 1's "What's Next" section
(`docs/superpowers/plans/2026-08-22-core-scaffold-local-data.md`) for
its scope: Supabase schema + RLS, Google OAuth via Supabase Auth, sync
toggle, `/api/sync` push/pull with last-write-wins conflict resolution.
