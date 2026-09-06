<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { getQuestion } from '$lib/stores/questions';
	import { getModelBySlug } from '$lib/stores/models';
	import { createAnalysis, listAnalysesForQuestionAndModel, rateAnalysis } from '$lib/stores/analyses';
	import { chartComponents } from '$lib/charts/registry';
	import ConfidenceVote from '$lib/ConfidenceVote.svelte';
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

	async function handleRate(rating: 1 | 2 | 3 | 4 | 5) {
		if (!activeAnalysisId) return;
		await rateAnalysis(activeAnalysisId, rating);
		analyses = analyses.map((a) =>
			a.id === activeAnalysisId ? { ...a, userRating: rating } : a
		);
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
		<a
			href={`/question/${question.id}`}
			class="no-print text-sm text-ink-muted hover:text-accent"
		>
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
				<div class="no-print flex flex-wrap gap-2 text-xs">
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
					<p class="print-only mt-3 hidden text-xs text-ink-muted">
						{formatTimestamp(activeAnalysis.createdAt)}
					</p>
					<div class="mt-3">
						<ActiveChart data={activeAnalysis.resultJson as never} />
					</div>
					<div class="no-print">
						<ConfidenceVote
							rating={activeAnalysis.userRating}
							onRate={handleRate}
						/>
					</div>
				{/if}

				<div class="no-print mt-3 flex gap-2">
					<button
						type="button"
						class="rounded-lg border border-border px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
						disabled={loading}
						onclick={runAnalysis}
					>
						{loading ? 'Analyzing…' : 'Re-analyze'}
					</button>
					{#if activeAnalysis}
						<button
							type="button"
							class="rounded-lg border border-border px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
							onclick={() => window.print()}
						>
							Print / Save as PDF
						</button>
					{/if}
				</div>
			{/if}

			{#if error}
				<p class="no-print mt-2 text-sm text-error">
					Analysis failed.
					<button type="button" class="underline" onclick={runAnalysis}>Try again</button>
				</p>
			{/if}
		</div>
	{:else if notFound}
		<p class="mt-4 text-ink-muted">Question or model not found.</p>
	{/if}
</main>
