# Editorial Visual Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the app from default-Tailwind slate/white into the "Editorial / Field Notes" identity (cream background, ink text, rust accent, Fraunces + Inter type) across all 5 pages plus the shared layout — pure CSS/markup, zero behavior change.

**Architecture:** One `@theme` block in `src/app.css` (Tailwind v4 CSS-first config) defines every color/font token as a utility class (`bg-bg`, `text-ink`, `border-border`, `text-accent`, `text-accent-moss`, `text-error`, `font-display`, `font-sans`). Every page then just swaps its existing `slate-*`/`red-600`/`indigo-600`/`emerald-600` utility classes for the new token classes — no new components, no new state, no new routes.

**Tech Stack:** SvelteKit 5 (runes), Tailwind CSS v4 (`@theme` CSS-first config), Google Fonts (Fraunces, Inter) via `@import url(...)`.

**Spec:** `docs/superpowers/specs/2026-08-23-editorial-visual-identity-design.md`

## Global Constraints

- No dark mode, no new components, no new routes, no behavior changes — pure restyle.
- Chart internals (`src/lib/charts/*.svelte`) are never touched — only the cards/pages they sit inside.
- Confirmed by reading every test file in the repo: **zero tests assert on CSS classes** — all query by visible text or ARIA role. The full 126-test suite must stay green through every task with zero test-file edits. If a task ever makes a test fail, that test was class-coupled in a way this plan didn't anticipate — stop and look at it, don't assume the restyle is wrong.
- Token values (exact, from the spec, copy verbatim): `--color-bg: #faf6ef`, `--color-surface: #ffffff`, `--color-ink: #1a1815`, `--color-ink-muted: #6b6459`, `--color-border: #e5dfd3`, `--color-accent: #c4622d`, `--color-accent-moss: #5b6e4f`, `--color-error: #a23e2e`.
- Badge color assignment is fixed: "Recommended" → `text-accent`, "Analyzed" → `text-accent-moss`. Never swap these.

---

### Task 1: Design tokens and fonts

**Files:**
- Modify: `src/app.css`

**Interfaces:**
- Consumes: nothing
- Produces: Tailwind utility classes every later task uses by name: `bg-bg`, `bg-surface`, `text-ink`, `text-ink-muted`, `border-border`, `text-accent`, `bg-accent`, `text-accent-moss`, `text-error`, `font-display`, `font-sans`. Also enables opacity-modifier variants (`bg-accent/90`, `ring-accent/20`) since Tailwind v4 derives those automatically from any `--color-*` token.

- [ ] **Step 1: Confirm baseline is green**

Run: `npm run test && npm run check`
Expected: 126 tests passed, 0 type errors. (This is the starting point every later task's own check compares against.)

- [ ] **Step 2: Add the theme block and font import**

Replace the full contents of `src/app.css`:

```css
@import 'tailwindcss';
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=Inter:wght@400..700&display=swap');

@theme {
	--color-bg: #faf6ef;
	--color-surface: #ffffff;
	--color-ink: #1a1815;
	--color-ink-muted: #6b6459;
	--color-border: #e5dfd3;
	--color-accent: #c4622d;
	--color-accent-moss: #5b6e4f;
	--color-error: #a23e2e;

	--font-display: 'Fraunces', ui-serif, Georgia, serif;
	--font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
}
```

- [ ] **Step 3: Verify nothing broke**

Run: `npm run test && npm run check`
Expected: 126 tests passed, 0 type errors. No page uses the new classes yet, so this step only proves the `@theme` block itself is valid CSS that Tailwind can parse.

- [ ] **Step 4: Commit**

```bash
git add src/app.css
git commit -m "feat: add editorial design tokens and fonts"
```

---

### Task 2: Layout and nav

**Files:**
- Modify: `src/routes/+layout.svelte`

**Interfaces:**
- Consumes: tokens from Task 1
- Produces: nothing consumed by a later task (the layout wraps every page but no page imports anything from it)

- [ ] **Step 1: Replace the layout**

Replace the full contents of `src/routes/+layout.svelte`:

```svelte
<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<div class="min-h-screen bg-bg font-sans text-ink">
	<header class="border-b border-border">
		<nav class="mx-auto flex max-w-4xl items-center gap-6 px-6 py-4">
			<a href="/" class="font-display text-lg font-semibold text-ink">Decision Copilot</a>
			<a href="/models" class="text-sm text-ink-muted transition-colors hover:text-accent">
				Model Library
			</a>
		</nav>
	</header>
	{@render children()}
</div>
```

- [ ] **Step 2: Verify**

Run: `npm run test && npm run check`
Expected: 126 tests passed, 0 type errors. (No test renders `+layout.svelte` directly — every page test renders its page component in isolation — so this step is confirming no regression elsewhere, not testing the layout itself.)

- [ ] **Step 3: Commit**

```bash
git add "src/routes/+layout.svelte"
git commit -m "feat: restyle nav and layout"
```

---

### Task 3: Home page

**Files:**
- Modify: `src/routes/+page.svelte`

**Interfaces:**
- Consumes: tokens from Task 1
- Produces: nothing consumed by a later task

- [ ] **Step 1: Replace the page**

Replace the full contents of `src/routes/+page.svelte`:

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
	<h1 class="font-display text-5xl font-semibold tracking-tight text-ink">
		Think it through.<br />Properly.
	</h1>
	<p class="mt-3 text-ink-muted">
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
			class="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
			placeholder="What are you trying to decide?"
			bind:value={questionText}
		/>
		<button
			type="submit"
			class="rounded-lg bg-accent px-5 py-3 font-medium text-white transition-colors hover:bg-accent/90"
		>
			Ask
		</button>
	</form>

	<ul class="mt-12 divide-y divide-border">
		{#each questions as question (question.id)}
			<li>
				<a href={`/question/${question.id}`} class="block py-4 text-ink hover:text-accent">
					{question.text}
				</a>
			</li>
		{/each}
	</ul>

	{#if questions.length === 0}
		<p class="mt-12 text-ink-muted">No questions yet.</p>
	{/if}
</main>
```

The `placeholder="What are you trying to decide?"` text and the `Ask` button label are unchanged on purpose — `src/routes/page.test.ts` queries both by exact string.

- [ ] **Step 2: Verify**

Run: `npm run test && npm run check`
Expected: 126 tests passed, 0 type errors.

- [ ] **Step 3: Commit**

```bash
git add "src/routes/+page.svelte"
git commit -m "feat: restyle home page with editorial hero"
```

---

### Task 4: Model Library

**Files:**
- Modify: `src/routes/models/+page.svelte`

**Interfaces:**
- Consumes: tokens from Task 1
- Produces: nothing consumed by a later task

- [ ] **Step 1: Replace the page**

Replace the full contents of `src/routes/models/+page.svelte`:

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
	<h1 class="font-display text-4xl font-semibold tracking-tight text-ink">Model Library</h1>
	<p class="mt-2 text-ink-muted">Every mental model available to analyze a question.</p>

	{#each byCategory as group (group.category)}
		{#if group.models.length > 0}
			<section class="mt-10">
				<h2 class="font-display text-sm font-semibold uppercase tracking-wide text-ink-muted">
					{group.label}
				</h2>
				<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
					{#each group.models as model (model.id)}
						<a
							href={`/models/${model.slug}`}
							class="rounded-xl border border-border bg-surface p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
						>
							<h3 class="font-medium text-ink">{model.name}</h3>
							<p class="mt-1 text-sm text-ink-muted">{model.description}</p>
						</a>
					{/each}
				</div>
			</section>
		{/if}
	{/each}
</main>
```

- [ ] **Step 2: Verify**

Run: `npm run test && npm run check`
Expected: 126 tests passed, 0 type errors.

- [ ] **Step 3: Commit**

```bash
git add "src/routes/models/+page.svelte"
git commit -m "feat: restyle model library"
```

---

### Task 5: Model detail

**Files:**
- Modify: `src/routes/models/[slug]/+page.svelte`

**Interfaces:**
- Consumes: tokens from Task 1
- Produces: nothing consumed by a later task

- [ ] **Step 1: Replace the page**

Replace the full contents of `src/routes/models/[slug]/+page.svelte`:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { getModelBySlug } from '$lib/stores/models';
	import type { ModelDef } from '$lib/types';
	import { chartComponents } from '$lib/charts/registry';

	let model = $state<ModelDef | undefined>(undefined);
	let notFound = $state(false);

	onMount(async () => {
		const slug = page.params.slug;
		if (!slug) return;
		model = await getModelBySlug(slug);
		notFound = model === undefined;
	});

	let ExampleChart = $derived(
		model ? chartComponents[model.chartComponent as keyof typeof chartComponents] : undefined
	);
</script>

<main class="mx-auto max-w-2xl px-6 py-16">
	{#if model}
		<a href="/models" class="text-sm text-ink-muted hover:text-accent">&larr; All models</a>
		<h1 class="font-display mt-4 text-3xl font-semibold tracking-tight text-ink">{model.name}</h1>
		<p class="mt-4 text-ink">{model.description}</p>

		<h2 class="font-display mt-8 text-sm font-semibold uppercase tracking-wide text-ink-muted">
			When to use it
		</h2>
		<p class="mt-2 text-ink">{model.whenToUse}</p>

		<h2 class="font-display mt-8 text-sm font-semibold uppercase tracking-wide text-ink-muted">
			Origin
		</h2>
		<p class="mt-2 text-ink">{model.origin}</p>

		<h2 class="font-display mt-8 text-sm font-semibold uppercase tracking-wide text-ink-muted">
			How to apply it
		</h2>
		<ol class="mt-2 list-decimal space-y-1 pl-5 text-ink">
			{#each model.howToApply as step (step)}
				<li>{step}</li>
			{/each}
		</ol>

		<div class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
			<div>
				<h2 class="font-display text-sm font-semibold uppercase tracking-wide text-ink-muted">
					Pros
				</h2>
				<ul class="mt-2 list-disc space-y-1 pl-5 text-ink">
					{#each model.pros as pro (pro)}
						<li>{pro}</li>
					{/each}
				</ul>
			</div>
			<div>
				<h2 class="font-display text-sm font-semibold uppercase tracking-wide text-ink-muted">
					Cons
				</h2>
				<ul class="mt-2 list-disc space-y-1 pl-5 text-ink">
					{#each model.cons as con (con)}
						<li>{con}</li>
					{/each}
				</ul>
			</div>
		</div>

		<h2 class="font-display mt-8 text-sm font-semibold uppercase tracking-wide text-ink-muted">
			Worked example
		</h2>
		<p class="mt-2 text-ink">{model.example.scenario}</p>

		{#if ExampleChart}
			<div class="mt-4 rounded-xl border border-border bg-surface p-4">
				<!-- shape is guaranteed at runtime by chartComponent/outputSchemaType pairing in seed data, not statically knowable here -->
				<ExampleChart data={model.example.result as never} />
			</div>
		{/if}
	{:else if notFound}
		<p class="text-ink-muted">Model not found.</p>
	{/if}
</main>
```

The chart component itself (`ExampleChart`) is unchanged — only the card it now sits inside (`border-border bg-surface p-4`) is new.

- [ ] **Step 2: Verify**

Run: `npm run test && npm run check`
Expected: all tests pass including `src/routes/models/[slug]/page.test.ts` and `page-radar.test.ts` (the radar test does `container.querySelector('svg polygon.radar-shape')`, which finds the element regardless of the new wrapping `<div>`).

- [ ] **Step 3: Commit**

```bash
git add "src/routes/models/[slug]/+page.svelte"
git commit -m "feat: restyle model detail page"
```

---

### Task 6: Question list

**Files:**
- Modify: `src/routes/question/[id]/+page.svelte`

**Interfaces:**
- Consumes: tokens from Task 1
- Produces: nothing consumed by a later task

- [ ] **Step 1: Replace the page**

Replace the full contents of `src/routes/question/[id]/+page.svelte`. Only the `<script>` block's classes are untouched (all logic identical) — the template's classes and the two badge colors change:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { getQuestion, setRecommendedModels } from '$lib/stores/questions';
	import { listModels } from '$lib/stores/models';
	import { listAnalysesForQuestion } from '$lib/stores/analyses';
	import type { Category, ModelDef, Question } from '$lib/types';

	const categoryLabels: Record<Category, string> = {
		'decision-making': 'Decision Making',
		'know-self': 'Knowing Yourself',
		'know-others': 'Knowing Others',
		'improve-others': 'Improving Others'
	};

	let question = $state<Question | undefined>(undefined);
	let models = $state<ModelDef[]>([]);
	let notFound = $state(false);
	let analyzedModelIds = $state<Set<string>>(new Set());
	let recommendedModelIds = $state<Set<string>>(new Set());

	onMount(async () => {
		const id = page.params.id;
		if (!id) return;
		question = await getQuestion(id);
		notFound = question === undefined;
		if (question) {
			models = await listModels();
			const analyses = await listAnalysesForQuestion(question.id);
			analyzedModelIds = new Set(analyses.map((a) => a.modelId));

			if (question.recommendedModelIds) {
				recommendedModelIds = new Set(question.recommendedModelIds);
			} else {
				fetchRecommendations(question, models);
			}
		}
	});

	async function fetchRecommendations(q: Question, allModels: ModelDef[]) {
		try {
			const res = await fetch('/api/recommend-models', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					questionText: q.text,
					models: allModels.map((m) => ({
						slug: m.slug,
						name: m.name,
						description: m.description
					}))
				})
			});
			if (!res.ok) return;
			const { modelSlugs } = (await res.json()) as { modelSlugs: string[] };
			const ids = allModels.filter((m) => modelSlugs.includes(m.slug)).map((m) => m.id);
			await setRecommendedModels(q.id, ids);
			recommendedModelIds = new Set(ids);
		} catch {
			// recommendations are a non-critical enhancement — fail silently
		}
	}

	let byCategory = $derived(
		(Object.keys(categoryLabels) as Category[]).map((category) => ({
			category,
			label: categoryLabels[category],
			models: models
				.filter((m) => m.category === category)
				.sort(
					(a, b) =>
						Number(recommendedModelIds.has(b.id)) - Number(recommendedModelIds.has(a.id))
				)
		}))
	);
</script>

<main class="mx-auto max-w-2xl px-6 py-16">
	<a href="/" class="text-sm text-ink-muted hover:text-accent">&larr; All questions</a>

	{#if question}
		<h1 class="font-display mt-4 text-2xl font-semibold tracking-tight text-ink">
			{question.text}
		</h1>

		<h2 class="font-display mt-10 text-sm font-semibold uppercase tracking-wide text-ink-muted">
			Pick a model
		</h2>
		{#each byCategory as group (group.category)}
			{#if group.models.length > 0}
				<div class="mt-6">
					<h3 class="text-xs font-medium uppercase tracking-wide text-ink-muted">
						{group.label}
					</h3>
					<div class="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
						{#each group.models as model (model.id)}
							<a
								href={`/question/${question.id}/${model.slug}`}
								class="block rounded-lg border border-border bg-surface p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
								data-testid={`model-card-${model.slug}`}
							>
								<div class="flex items-start justify-between gap-2">
									<span class="font-medium text-ink">{model.name}</span>
									<div class="flex shrink-0 gap-1.5">
										{#if recommendedModelIds.has(model.id)}
											<span class="text-xs font-medium uppercase tracking-wide text-accent">
												Recommended
											</span>
										{/if}
										{#if analyzedModelIds.has(model.id)}
											<span class="text-xs font-medium uppercase tracking-wide text-accent-moss">
												Analyzed
											</span>
										{/if}
									</div>
								</div>
								<p class="mt-1 text-sm text-ink-muted">{model.description}</p>
							</a>
						{/each}
					</div>
				</div>
			{/if}
		{/each}
	{:else if notFound}
		<p class="mt-4 text-ink-muted">Question not found.</p>
	{/if}
</main>
```

- [ ] **Step 2: Verify**

Run: `npm run test && npm run check`
Expected: all tests pass, including the badge test (`shows an Analyzed badge only for models with existing history`) and the recommend tests in `src/routes/question/[id]/page.test.ts` — they assert on the text "Analyzed"/"Recommended", not on which color class renders it.

- [ ] **Step 3: Commit**

```bash
git add "src/routes/question/[id]/+page.svelte"
git commit -m "feat: restyle question list page"
```

---

### Task 7: Question detail

**Files:**
- Modify: `src/routes/question/[id]/[slug]/+page.svelte`

**Interfaces:**
- Consumes: tokens from Task 1
- Produces: nothing consumed by a later task — this is the last task in the plan.

- [ ] **Step 1: Replace the page**

Replace the full contents of `src/routes/question/[id]/[slug]/+page.svelte`. The `<script>` block is untouched — only template classes change:

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { getQuestion } from '$lib/stores/questions';
	import { getModelBySlug } from '$lib/stores/models';
	import { createAnalysis, listAnalysesForQuestionAndModel } from '$lib/stores/analyses';
	import { chartComponents } from '$lib/charts/registry';
	import type { Analysis, ModelDef, Question } from '$lib/types';

	let question = $state<Question | undefined>(undefined);
	let model = $state<ModelDef | undefined>(undefined);
	let notFound = $state(false);
	let analyses = $state<Analysis[]>([]);
	let activeAnalysisId = $state<string | null>(null);
	let loading = $state(false);
	let error = $state(false);

	onMount(async () => {
		const { id, slug } = page.params;
		if (!id || !slug) return;
		question = await getQuestion(id);
		model = await getModelBySlug(slug);
		notFound = question === undefined || model === undefined;
		if (question && model) {
			analyses = await listAnalysesForQuestionAndModel(question.id, model.id);
			if (analyses.length > 0) {
				activeAnalysisId = analyses[0].id;
			}
		}
	});

	let activeAnalysis = $derived(analyses.find((a) => a.id === activeAnalysisId));
	let ActiveChart = $derived(
		model ? chartComponents[model.chartComponent as keyof typeof chartComponents] : undefined
	);

	function formatTimestamp(iso: string): string {
		return new Date(iso).toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	async function runAnalysis() {
		if (!question || !model) return;
		loading = true;
		error = false;
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
			analyses = [created, ...analyses];
			activeAnalysisId = created.id;
		} catch {
			error = true;
		} finally {
			loading = false;
		}
	}
</script>

<main class="mx-auto max-w-2xl px-6 py-16">
	{#if question && model}
		<a href={`/question/${question.id}`} class="text-sm text-ink-muted hover:text-accent">
			&larr; Back to question
		</a>
		<p class="mt-4 text-sm text-ink-muted">{question.text}</p>
		<h1 class="font-display mt-1 text-2xl font-semibold tracking-tight text-ink">{model.name}</h1>

		<div class="mt-6 border-t border-border pt-6">
			{#if analyses.length === 0}
				<button
					type="button"
					class="rounded-lg bg-accent px-3 py-1.5 text-sm text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
					disabled={loading}
					onclick={runAnalysis}
				>
					{loading ? 'Analyzing…' : 'Analyze'}
				</button>
			{:else}
				<div class="flex flex-wrap gap-2 text-xs">
					{#each analyses as run (run.id)}
						<button
							type="button"
							class={activeAnalysisId === run.id
								? 'font-semibold text-accent'
								: 'text-ink-muted hover:text-accent'}
							onclick={() => (activeAnalysisId = run.id)}
						>
							{formatTimestamp(run.createdAt)}
						</button>
					{/each}
				</div>

				{#if ActiveChart && activeAnalysis}
					<div class="mt-3">
						<ActiveChart data={activeAnalysis.resultJson as never} />
					</div>
				{/if}

				<button
					type="button"
					class="mt-3 rounded-lg border border-border px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
					disabled={loading}
					onclick={runAnalysis}
				>
					{loading ? 'Analyzing…' : 'Re-analyze'}
				</button>
			{/if}

			{#if error}
				<p class="mt-2 text-sm text-error">
					Analysis failed.
					<button type="button" class="underline" onclick={runAnalysis}>Try again</button>
				</p>
			{/if}
		</div>
	{:else if notFound}
		<p class="mt-4 text-ink-muted">Question or model not found.</p>
	{/if}
</main>
```

- [ ] **Step 2: Verify**

Run: `npm run test && npm run check`
Expected: all tests pass, including `src/routes/question/[id]/[slug]/page.test.ts`'s error-state test (`findByText(/Analysis failed/)`) — it asserts on the message text, not the `text-error` vs `text-red-600` class.

- [ ] **Step 3: Commit**

```bash
git add "src/routes/question/[id]/[slug]/+page.svelte"
git commit -m "feat: restyle question detail page"
```

---

## Self-Review Notes

- **Spec coverage:** design tokens + fonts (✅ Task 1), nav/layout (✅ Task 2), home hero copy + restyle (✅ Task 3), model library card treatment (✅ Task 4), model detail incl. chart card wrapper (✅ Task 5), question list card + badge recolor (✅ Task 6), question detail button/history/error recolor (✅ Task 7). Chart internals confirmed untouched in every task — no task modifies any file under `src/lib/charts/`. No dark mode, no new components, no new routes anywhere in the plan.
- **Placeholder scan:** none — every task replaces a file with its complete new content, no partial edits described in prose.
- **Type consistency:** every `<script>` block is either untouched (Tasks 2, 6, 7) or unchanged in shape (Tasks 3, 4, 5 keep the same state/derived/functions, only JSX-equivalent template classes change) — no task alters a store signature, prop type, or component interface, so there's nothing for a later task to get out of sync with.

---

## What's Next

This plan is purely visual. It doesn't include: dark mode, a custom
favicon/OG image using the new palette, or reskinning the 6 D3 charts
to use the rust/moss accent colors internally (they currently use
their own independently-designed color scheme, which was intentionally
left alone per the spec). Any of those would be their own follow-up
brainstorm.
